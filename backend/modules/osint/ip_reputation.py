import asyncio
import socket
import ipaddress
import httpx
from typing import AsyncGenerator


# DNS blacklists (DNSBL) — reverse IP lookup
DNSBLS = [
    ("zen.spamhaus.org",    "Spamhaus ZEN (spam + exploits)"),
    ("bl.spamcop.net",      "SpamCop"),
    ("dnsbl.sorbs.net",     "SORBS"),
    ("cbl.abuseat.org",     "Composite Blocking List"),
    ("b.barracudacentral.org", "Barracuda"),
    ("dnsbl-1.uceprotect.net", "UCEProtect L1"),
    ("psbl.surriel.com",    "PSBL"),
    ("ix.dnsbl.manitu.net", "iX Manitu"),
]


def _reverse_ip(ip: str) -> str:
    """Returns the reverse-dotted IP for DNSBL lookup (e.g. 1.2.3.4 -> 4.3.2.1)"""
    return ".".join(reversed(ip.split(".")))


async def _check_dnsbl(reversed_ip: str, blacklist: str) -> bool:
    """Returns True if listed (NXDOMAIN = not listed, A record = listed)"""
    query = f"{reversed_ip}.{blacklist}"
    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(None, socket.gethostbyname, query)
        return True  # Got an A record = listed
    except socket.gaierror:
        return False  # NXDOMAIN = not listed


async def ip_reputation(ip: str) -> AsyncGenerator:
    # Validate IP
    try:
        addr = ipaddress.ip_address(ip)
        if addr.is_private:
            yield {"type": "warn", "message": f"{ip} is a private/internal address — skipping DNSBL checks"}
        if addr.is_loopback:
            yield {"type": "warn", "message": f"{ip} is loopback"}
    except ValueError:
        yield {"type": "error", "message": f"Invalid IP address: {ip}"}
        return

    yield {"type": "info", "message": f"IP Reputation check for {ip}"}

    # --- ipinfo.io basic info ---
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(f"https://ipinfo.io/{ip}/json")
            if r.status_code == 200:
                data = r.json()
                yield {"type": "info",   "message": "--- IPINFO ---"}
                yield {"type": "data",   "message": f"  IP:       {data.get('ip', ip)}"}
                if "hostname" in data:
                    yield {"type": "data", "message": f"  Hostname: {data['hostname']}"}
                if "org" in data:
                    yield {"type": "data", "message": f"  Org/ASN:  {data['org']}"}
                if "city" in data or "country" in data:
                    loc = ", ".join(filter(None, [data.get("city"), data.get("region"), data.get("country")]))
                    yield {"type": "data", "message": f"  Location: {loc}"}
                if "postal" in data:
                    yield {"type": "data", "message": f"  Postal:   {data['postal']}"}
                if "timezone" in data:
                    yield {"type": "data", "message": f"  Timezone: {data['timezone']}"}
    except Exception as e:
        yield {"type": "warn", "message": f"ipinfo.io lookup failed: {e}"}

    # --- Reverse DNS ---
    try:
        loop = asyncio.get_event_loop()
        hostname = await loop.run_in_executor(None, socket.gethostbyaddr, ip)
        yield {"type": "found", "message": f"  rDNS:     {hostname[0]}"}
    except Exception:
        yield {"type": "data", "message": "  rDNS:     (no PTR record)"}

    # --- DNSBL checks ---
    if not addr.is_private and not addr.is_loopback:
        yield {"type": "info", "message": f"--- Blacklist Checks ({len(DNSBLS)} lists) ---"}
        reversed_ip = _reverse_ip(ip)
        listed_count = 0

        tasks = [(_check_dnsbl(reversed_ip, bl), name) for bl, name in DNSBLS]
        results = await asyncio.gather(*[t[0] for t in tasks], return_exceptions=True)

        for (_, name), result in zip(tasks, results):
            if isinstance(result, Exception):
                yield {"type": "warn", "message": f"  [{name}] check failed"}
            elif result:
                listed_count += 1
                yield {"type": "vuln", "message": f"  [LISTED]  {name}"}
            else:
                yield {"type": "found", "message": f"  [CLEAN]   {name}"}

        if listed_count == 0:
            yield {"type": "result", "message": f"✓ {ip} is not listed on any of {len(DNSBLS)} blacklists"}
        else:
            yield {"type": "vuln", "message": f"⚠ {ip} is listed on {listed_count}/{len(DNSBLS)} blacklists"}
    else:
        yield {"type": "info", "message": "Skipping DNSBL checks for private/loopback addresses"}

    yield {"type": "done", "message": "IP reputation check complete"}
