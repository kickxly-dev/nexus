from __future__ import annotations

import asyncio
import aiohttp
from typing import AsyncGenerator, Optional
from urllib.parse import quote

TIMEOUT = aiohttp.ClientTimeout(total=20)
GITHUB_SEARCH_API = "https://api.github.com/search/code"

# Sensitive pattern dorks to run when a domain is provided
SENSITIVE_PATTERNS = [
    "{target} password",
    "{target} api_key",
    "{target} secret",
    "{target} .env",
    "{target} token",
    "{target} private_key",
    "{target} access_key",
    "{target} credentials",
    "{target} passwd",
    "{target} auth",
]


async def _search_github(
    session: aiohttp.ClientSession,
    query: str,
    headers: dict,
) -> tuple[list[dict], str]:
    """Run a single GitHub code search. Returns (items, error_message)."""
    params = {"q": query, "per_page": "30"}
    try:
        async with session.get(
            GITHUB_SEARCH_API,
            params=params,
            headers=headers,
            ssl=False,
        ) as resp:
            if resp.status == 200:
                data = await resp.json()
                return data.get("items", []), ""
            elif resp.status == 403:
                remaining = resp.headers.get("X-RateLimit-Remaining", "?")
                reset = resp.headers.get("X-RateLimit-Reset", "?")
                if remaining == "0":
                    return [], f"Rate limit exceeded (resets at Unix timestamp {reset}). Use a GitHub token to increase limits."
                return [], "Access forbidden (403). A valid GitHub token may be required."
            elif resp.status == 422:
                return [], "Invalid query (422). Query may be too short or contain unsupported operators."
            elif resp.status == 401:
                return [], "Invalid GitHub token (401). Check your token and try again."
            else:
                return [], f"GitHub API error: HTTP {resp.status}"
    except asyncio.TimeoutError:
        return [], "Request timed out"
    except aiohttp.ClientError as e:
        return [], f"Request error: {e}"
    except Exception as e:
        return [], f"Unexpected error: {e}"


async def github_dork(query: str, token: Optional[str] = None) -> AsyncGenerator:
    yield {"type": "info", "message": f"Starting GitHub code search for: {query!r}"}

    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Nexus-Security-Toolkit/1.0",
    }
    if token and token.strip():
        headers["Authorization"] = f"token {token.strip()}"
        yield {"type": "info", "message": "[Auth] Using provided GitHub token"}
    else:
        yield {"type": "warn", "message": "[Auth] No token provided — rate limit: 10 requests/minute. Add a token for 30 req/min."}

    # Determine if we should run multi-pattern dork (domain-like input)
    is_domain = "." in query and " " not in query and len(query) > 4
    queries_to_run = []

    if is_domain:
        yield {"type": "info", "message": f"[Mode] Domain detected — running {len(SENSITIVE_PATTERNS)} sensitive pattern searches"}
        for pattern in SENSITIVE_PATTERNS:
            queries_to_run.append(pattern.format(target=query))
    else:
        queries_to_run.append(query)

    total_results = 0
    seen_urls: set[str] = set()

    async with aiohttp.ClientSession(timeout=TIMEOUT, headers=headers) as session:
        for i, dork_query in enumerate(queries_to_run):
            if len(queries_to_run) > 1:
                yield {"type": "progress", "message": f"[{i+1}/{len(queries_to_run)}] Searching: {dork_query!r}"}

            items, error = await _search_github(session, dork_query, headers)

            if error:
                yield {"type": "warn", "message": f"[GitHub] {error}"}
                if "Rate limit" in error or "rate limit" in error:
                    yield {"type": "warn", "message": "Stopping further queries to avoid wasted requests"}
                    break
                continue

            if not items:
                yield {"type": "info", "message": f"[GitHub] No results for: {dork_query!r}"}
            else:
                yield {"type": "info", "message": f"[GitHub] {len(items)} result(s) for: {dork_query!r}"}

            for item in items:
                file_url = item.get("html_url", "")
                if file_url in seen_urls:
                    continue
                seen_urls.add(file_url)

                repo_name = item.get("repository", {}).get("full_name", "unknown/repo")
                file_path = item.get("path", "")
                file_name = item.get("name", "")
                repo_url = item.get("repository", {}).get("html_url", "")
                private = item.get("repository", {}).get("private", False)

                total_results += 1
                yield {
                    "type": "found",
                    "repo": repo_name,
                    "file": file_path,
                    "url": file_url,
                    "repo_url": repo_url,
                    "query": dork_query,
                    "message": f"[Found] {repo_name} — {file_path}\n  URL: {file_url}",
                }

            # Respect rate limits — small delay between queries
            if i < len(queries_to_run) - 1:
                await asyncio.sleep(2)

    if total_results > 0:
        yield {
            "type": "found",
            "total": total_results,
            "message": f"[Summary] {total_results} unique file(s) found across GitHub",
        }
    else:
        yield {"type": "info", "message": "No results found. Try different search terms or check rate limits."}

    yield {"type": "done", "message": "GitHub code search complete"}
