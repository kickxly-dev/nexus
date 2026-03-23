import asyncio
import httpx
import dns.asyncresolver
import dns.exception
from pathlib import Path
from typing import AsyncGenerator
from config import DEFAULT_SUBDOMAIN_WORDLIST


async def enumerate_subdomains(domain: str, wordlist_path: str = None) -> AsyncGenerator:
    wl = Path(wordlist_path) if wordlist_path else DEFAULT_SUBDOMAIN_WORDLIST

    yield {"type": "info", "message": f"Starting subdomain enumeration for {domain}"}

    # 1. crt.sh Certificate Transparency
    yield {"type": "info", "message": "Checking Certificate Transparency logs (crt.sh)..."}
    ct_found = set()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(f"https://crt.sh/?q=%.{domain}&output=json")
            if r.status_code == 200:
                for entry in r.json():
                    name = entry.get("name_value", "").strip().lower()
                    for sub in name.split("\n"):
                        sub = sub.strip().lstrip("*.")
                        if sub.endswith(f".{domain}") and sub not in ct_found:
                            ct_found.add(sub)
                            yield {
                                "type": "found",
                                "subdomain": sub,
                                "source": "crt.sh",
                                "message": f"[CT] {sub}",
                            }
    except Exception as e:
        yield {"type": "warn", "message": f"crt.sh lookup failed: {e}"}

    # 2. Wordlist brute-force
    if not wl.exists():
        yield {"type": "warn", "message": f"Wordlist not found: {wl}. Skipping brute-force."}
        yield {"type": "done", "message": "Subdomain enumeration complete"}
        return

    yield {"type": "info", "message": f"Starting DNS brute-force..."}

    resolver = dns.asyncresolver.Resolver()
    resolver.timeout = 3
    resolver.lifetime = 3

    found = set(ct_found)
    tried = 0
    sem = asyncio.Semaphore(50)

    async def check(word):
        nonlocal tried
        subdomain = f"{word.strip()}.{domain}"
        if subdomain in found:
            return
        async with sem:
            try:
                answers = await resolver.resolve(subdomain, "A")
                ips = [r.address for r in answers]
                found.add(subdomain)
                return {"type": "found", "subdomain": subdomain, "ips": ips, "source": "bruteforce",
                        "message": f"[DNS] {subdomain} -> {', '.join(ips)}"}
            except Exception:
                return None

    with open(wl) as f:
        words = [line.strip() for line in f if line.strip()]

    tasks = [check(w) for w in words]
    for coro in asyncio.as_completed(tasks):
        result = await coro
        tried += 1
        if result:
            yield result
        if tried % 500 == 0:
            yield {"type": "progress", "tried": tried, "total": len(words),
                   "message": f"Tried {tried}/{len(words)} subdomains..."}

    yield {"type": "done", "message": f"Subdomain enumeration complete. Found {len(found)} subdomains."}
