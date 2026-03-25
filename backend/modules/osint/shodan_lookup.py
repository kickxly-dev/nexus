from __future__ import annotations

import asyncio
import aiohttp
from typing import AsyncGenerator, Optional

TIMEOUT = aiohttp.ClientTimeout(total=20)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

SHODAN_HOST_API = "https://api.shodan.io/shodan/host/{ip}"
IPAPI_URL = "https://ipapi.co/{ip}/json/"


async def _fetch_ipapi(session: aiohttp.ClientSession, ip: str) -> AsyncGenerator:
    """Fetch basic IP info from ipapi.co (free, no key required)."""
    try:
        async with session.get(IPAPI_URL.format(ip=ip), ssl=False) as resp:
            if resp.status == 200:
                data = await resp.json()
                return data
            return {}
    except Exception:
        return {}


async def shodan_lookup(target: str, api_key: Optional[str] = None) -> AsyncGenerator:
    yield {"type": "info", "message": f"Starting intelligence lookup for {target}"}

    async with aiohttp.ClientSession(timeout=TIMEOUT, headers=HEADERS) as session:
        # Source 1: Free IP geolocation from ipapi.co
        yield {"type": "progress", "message": "Fetching IP geolocation from ipapi.co..."}
        try:
            async with session.get(IPAPI_URL.format(ip=target), ssl=False) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data and not data.get("error"):
                        city = data.get("city", "unknown")
                        region = data.get("region", "unknown")
                        country = data.get("country_name", "unknown")
                        org = data.get("org", "unknown")
                        asn = data.get("asn", "unknown")
                        isp = data.get("isp", "unknown")
                        hostname = data.get("hostname", "")
                        lat = data.get("latitude", "?")
                        lon = data.get("longitude", "?")
                        timezone = data.get("timezone", "unknown")

                        yield {"type": "data", "message": f"[Location] {city}, {region}, {country}"}
                        yield {"type": "data", "message": f"[Coordinates] {lat}, {lon} | Timezone: {timezone}"}
                        yield {"type": "data", "message": f"[ASN] {asn} — {org}"}
                        yield {"type": "data", "message": f"[ISP] {isp}"}
                        if hostname:
                            yield {"type": "found", "hostname": hostname, "message": f"[Hostname] {hostname}"}

                        # Check if it's a cloud/hosting provider
                        cloud_indicators = ["amazon", "aws", "google", "azure", "microsoft",
                                            "cloudflare", "digitalocean", "linode", "vultr",
                                            "hetzner", "ovh", "hosting", "datacenter", "data center"]
                        org_lower = org.lower()
                        for indicator in cloud_indicators:
                            if indicator in org_lower:
                                yield {
                                    "type": "info",
                                    "message": f"[Cloud] IP appears to be hosted on cloud/CDN infrastructure ({org})",
                                }
                                break
                    else:
                        err = data.get("reason", data.get("error", "Unknown error"))
                        yield {"type": "warn", "message": f"[ipapi.co] Error: {err}"}
                elif resp.status == 429:
                    yield {"type": "warn", "message": "[ipapi.co] Rate limit reached — try again later"}
                else:
                    yield {"type": "warn", "message": f"[ipapi.co] HTTP {resp.status}"}
        except asyncio.TimeoutError:
            yield {"type": "warn", "message": "[ipapi.co] Request timed out"}
        except Exception as e:
            yield {"type": "warn", "message": f"[ipapi.co] Error: {e}"}

        await asyncio.sleep(0.3)

        # Source 2: Shodan API (if key provided)
        if api_key and api_key.strip():
            yield {"type": "progress", "message": "Querying Shodan API..."}
            shodan_url = SHODAN_HOST_API.format(ip=target)
            params = {"key": api_key.strip()}
            try:
                async with session.get(shodan_url, params=params, ssl=False) as resp:
                    if resp.status == 200:
                        data = await resp.json()

                        # Basic info
                        os_info = data.get("os", "unknown")
                        country = data.get("country_name", data.get("country_code", "?"))
                        org = data.get("org", data.get("isp", "?"))
                        hostnames = data.get("hostnames", [])
                        domains = data.get("domains", [])
                        tags = data.get("tags", [])
                        last_update = data.get("last_update", "?")

                        yield {"type": "data", "message": f"[Shodan] Organization: {org}"}
                        yield {"type": "data", "message": f"[Shodan] OS: {os_info}"}
                        yield {"type": "data", "message": f"[Shodan] Last updated: {last_update}"}

                        if hostnames:
                            for h in hostnames:
                                yield {"type": "found", "hostname": h, "message": f"[Hostname] {h}"}

                        if domains:
                            for d in domains:
                                yield {"type": "found", "domain": d, "message": f"[Domain] {d}"}

                        if tags:
                            yield {"type": "info", "message": f"[Tags] {', '.join(tags)}"}

                        # Open ports
                        ports = data.get("ports", [])
                        if ports:
                            yield {
                                "type": "found",
                                "ports": ports,
                                "message": f"[Open Ports] {', '.join(str(p) for p in sorted(ports))}",
                            }

                        # Services / banners
                        services = data.get("data", [])
                        for svc in services:
                            port = svc.get("port", "?")
                            transport = svc.get("transport", "tcp")
                            product = svc.get("product", "")
                            version_str = svc.get("version", "")
                            banner = svc.get("banner", svc.get("data", ""))[:200]
                            cpes = svc.get("cpe", [])

                            svc_desc = f"{port}/{transport}"
                            if product:
                                svc_desc += f" — {product}"
                            if version_str:
                                svc_desc += f" {version_str}"

                            yield {
                                "type": "data",
                                "port": port,
                                "product": product,
                                "version": version_str,
                                "message": f"[Service] {svc_desc}",
                            }

                            if cpes:
                                yield {"type": "info", "message": f"  [CPE] {', '.join(cpes[:3])}"}

                        # Vulnerabilities
                        vulns = data.get("vulns", {})
                        if vulns:
                            yield {
                                "type": "vuln",
                                "count": len(vulns),
                                "message": f"[Shodan] {len(vulns)} CVE(s) reported by Shodan",
                            }
                            for cve_id, cve_data in list(vulns.items())[:20]:
                                cvss = cve_data.get("cvss", "?")
                                summary = cve_data.get("summary", "")[:120]
                                yield {
                                    "type": "vuln",
                                    "cve": cve_id,
                                    "cvss": cvss,
                                    "message": f"  [CVE] {cve_id} (CVSS: {cvss}) — {summary}",
                                }

                    elif resp.status == 401:
                        yield {"type": "warn", "message": "[Shodan] Invalid API key (401). Get a free key at https://account.shodan.io/register"}
                    elif resp.status == 404:
                        yield {"type": "info", "message": "[Shodan] No information found for this IP in Shodan database"}
                    elif resp.status == 429:
                        yield {"type": "warn", "message": "[Shodan] Rate limit reached"}
                    else:
                        yield {"type": "warn", "message": f"[Shodan] HTTP {resp.status}"}

            except asyncio.TimeoutError:
                yield {"type": "warn", "message": "[Shodan] Request timed out"}
            except Exception as e:
                yield {"type": "warn", "message": f"[Shodan] Error: {e}"}

        else:
            yield {
                "type": "info",
                "message": "[Shodan] No API key provided — Shodan data unavailable. Get a free key at https://account.shodan.io/register",
            }

        await asyncio.sleep(0.3)

        # Source 3: AbuseIPDB public lookup (no key needed for basic info)
        yield {"type": "progress", "message": "Checking additional threat intelligence..."}
        try:
            # Use ip-api.com for additional info (no key needed)
            ip_api_url = f"http://ip-api.com/json/{target}?fields=status,message,country,regionName,city,isp,org,as,hosting,proxy,mobile,query"
            async with session.get(ip_api_url) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data.get("status") == "success":
                        is_hosting = data.get("hosting", False)
                        is_proxy = data.get("proxy", False)
                        is_mobile = data.get("mobile", False)
                        as_info = data.get("as", "")

                        flags = []
                        if is_hosting:
                            flags.append("hosting/datacenter IP")
                        if is_proxy:
                            flags.append("proxy/VPN detected")
                        if is_mobile:
                            flags.append("mobile network")

                        if flags:
                            yield {
                                "type": "warn",
                                "flags": flags,
                                "message": f"[ip-api] Flags: {', '.join(flags)}",
                            }

                        if as_info:
                            yield {"type": "data", "message": f"[ip-api] AS: {as_info}"}
        except Exception as e:
            yield {"type": "info", "message": f"[ip-api] Could not fetch additional info: {e}"}

    yield {"type": "done", "message": "Intelligence lookup complete"}
