from __future__ import annotations

import asyncio
import aiohttp
from typing import AsyncGenerator

TIMEOUT = aiohttp.ClientTimeout(total=20)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

HACKERTARGET_REVERSE = "https://api.hackertarget.com/reverseiplookup/?q={ip}"
HACKERTARGET_HOSTSEARCH = "https://api.hackertarget.com/hostsearch/?q={ip}"


async def reverse_ip_lookup(ip: str) -> AsyncGenerator:
    yield {"type": "info", "message": f"Starting reverse IP lookup for {ip}"}

    all_domains: set[str] = set()

    async with aiohttp.ClientSession(timeout=TIMEOUT, headers=HEADERS) as session:
        # Source 1: HackerTarget reverse IP lookup
        yield {"type": "progress", "message": "Querying HackerTarget reverse IP lookup..."}
        try:
            url = HACKERTARGET_REVERSE.format(ip=ip)
            async with session.get(url, ssl=False) as resp:
                if resp.status == 200:
                    text = await resp.text(errors="replace")
                    if "error" in text.lower() and "no records" in text.lower():
                        yield {"type": "info", "message": "[HackerTarget] No domains found for this IP"}
                    elif "API count exceeded" in text or "You have exceeded" in text:
                        yield {"type": "warn", "message": "[HackerTarget] Rate limit reached — try again later"}
                    else:
                        lines = [l.strip() for l in text.splitlines() if l.strip()]
                        for domain in lines:
                            if domain and "." in domain and not domain.startswith("error"):
                                if domain not in all_domains:
                                    all_domains.add(domain)
                                    yield {
                                        "type": "found",
                                        "domain": domain,
                                        "source": "hackertarget_reverse",
                                        "message": f"[Domain] {domain}",
                                    }
                        if lines:
                            yield {"type": "info", "message": f"[HackerTarget] Found {len(lines)} domains"}
                else:
                    yield {"type": "warn", "message": f"[HackerTarget] HTTP {resp.status}"}
        except asyncio.TimeoutError:
            yield {"type": "warn", "message": "[HackerTarget] Request timed out"}
        except aiohttp.ClientError as e:
            yield {"type": "warn", "message": f"[HackerTarget] Request error: {e}"}
        except Exception as e:
            yield {"type": "warn", "message": f"[HackerTarget] Error: {e}"}

        await asyncio.sleep(0.5)

        # Source 2: HackerTarget host search
        yield {"type": "progress", "message": "Querying HackerTarget host search..."}
        try:
            url = HACKERTARGET_HOSTSEARCH.format(ip=ip)
            async with session.get(url, ssl=False) as resp:
                if resp.status == 200:
                    text = await resp.text(errors="replace")
                    if "error" in text.lower() and "no records" in text.lower():
                        yield {"type": "info", "message": "[HackerTarget HostSearch] No records found"}
                    elif "API count exceeded" in text or "You have exceeded" in text:
                        yield {"type": "warn", "message": "[HackerTarget HostSearch] Rate limit reached"}
                    else:
                        # Format: domain,ip
                        new_from_hostsearch = 0
                        for line in text.splitlines():
                            line = line.strip()
                            if not line or "error" in line.lower():
                                continue
                            parts = line.split(",")
                            if parts:
                                domain = parts[0].strip()
                                if domain and "." in domain and domain not in all_domains:
                                    all_domains.add(domain)
                                    new_from_hostsearch += 1
                                    yield {
                                        "type": "found",
                                        "domain": domain,
                                        "source": "hackertarget_hostsearch",
                                        "message": f"[Domain] {domain} (host search)",
                                    }
                        if new_from_hostsearch:
                            yield {"type": "info", "message": f"[HostSearch] Found {new_from_hostsearch} additional domains"}
                else:
                    yield {"type": "warn", "message": f"[HackerTarget HostSearch] HTTP {resp.status}"}
        except asyncio.TimeoutError:
            yield {"type": "warn", "message": "[HackerTarget HostSearch] Request timed out"}
        except aiohttp.ClientError as e:
            yield {"type": "warn", "message": f"[HackerTarget HostSearch] Request error: {e}"}
        except Exception as e:
            yield {"type": "warn", "message": f"[HackerTarget HostSearch] Error: {e}"}

    # Summary
    if all_domains:
        yield {
            "type": "found",
            "count": len(all_domains),
            "domains": sorted(all_domains),
            "message": f"[Summary] Total unique domains on {ip}: {len(all_domains)}",
        }
    else:
        yield {"type": "info", "message": f"No domains found hosted on {ip}"}

    yield {"type": "done", "message": "Reverse IP lookup complete"}
