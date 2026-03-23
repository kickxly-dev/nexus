import asyncio
import json
import hashlib
import re
import httpx
from pathlib import Path
from typing import AsyncGenerator

SIGNATURES_PATH = Path(__file__).parent.parent.parent / "data" / "signatures.json"


async def fingerprint(url: str) -> AsyncGenerator:
    yield {"type": "info", "message": f"Fingerprinting {url}..."}

    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True,
                                      headers={"User-Agent": "Mozilla/5.0"}) as client:
            r = await client.get(url)

        headers = dict(r.headers)
        body = r.text
        detected = []

        # Header-based detection
        header_checks = {
            "server": headers.get("server", ""),
            "x-powered-by": headers.get("x-powered-by", ""),
            "x-generator": headers.get("x-generator", ""),
            "x-drupal-cache": headers.get("x-drupal-cache", ""),
            "x-wp-nonce": headers.get("x-wp-nonce", ""),
        }

        for header, value in header_checks.items():
            if value:
                yield {"type": "found", "category": "header", "header": header, "value": value,
                       "message": f"[Header] {header}: {value}"}
                detected.append(value)

        # Security header analysis
        security_headers = ["strict-transport-security", "content-security-policy",
                            "x-frame-options", "x-content-type-options", "referrer-policy"]
        missing = [h for h in security_headers if h not in headers]
        if missing:
            yield {"type": "warn", "message": f"Missing security headers: {', '.join(missing)}"}

        # Cookie-based detection
        cookies = r.cookies
        for cookie in cookies:
            if "wordpress" in cookie.lower() or "wp-" in cookie.lower():
                yield {"type": "found", "category": "cookie", "message": f"[Cookie] WordPress detected (cookie: {cookie})"}
            elif "laravel" in cookie.lower():
                yield {"type": "found", "category": "cookie", "message": f"[Cookie] Laravel detected"}
            elif "phpsessid" in cookie.lower():
                yield {"type": "found", "category": "cookie", "message": f"[Cookie] PHP detected"}

        # Body-based detection (patterns)
        patterns = {
            "WordPress": [r"wp-content", r"wp-includes", r"/wp-json/"],
            "Drupal": [r"Drupal\.settings", r"/sites/default/files/"],
            "Joomla": [r"/components/com_", r"Joomla!"],
            "React": [r"__reactFiber", r"react\.development\.js", r"react\.production\.min\.js"],
            "Vue.js": [r"vue\.runtime", r"__vue__"],
            "Angular": [r"ng-version", r"angular\.min\.js"],
            "jQuery": [r"jquery\.min\.js", r"jQuery v"],
            "Bootstrap": [r"bootstrap\.min\.css", r"bootstrap\.bundle"],
            "Nginx": [r"nginx/"],
            "Apache": [r"Apache/"],
        }

        for tech, pats in patterns.items():
            for pat in pats:
                if re.search(pat, body, re.IGNORECASE):
                    if tech not in detected:
                        detected.append(tech)
                        yield {"type": "found", "category": "body", "technology": tech,
                               "message": f"[Tech] {tech} detected"}
                    break

        # Meta generator tag
        gen_match = re.search(r'<meta[^>]+name=["\']generator["\'][^>]+content=["\']([^"\']+)["\']', body, re.IGNORECASE)
        if gen_match:
            gen = gen_match.group(1)
            yield {"type": "found", "category": "meta", "generator": gen,
                   "message": f"[Meta] Generator: {gen}"}

        yield {"type": "info", "message": f"HTTP {r.status_code} | {len(body)} bytes"}
        yield {"type": "done", "message": f"Fingerprinting complete. Detected {len(detected)} technologies."}

    except httpx.RequestError as e:
        yield {"type": "error", "message": f"Request failed: {str(e)}"}
    except Exception as e:
        yield {"type": "error", "message": f"Fingerprint error: {str(e)}"}
