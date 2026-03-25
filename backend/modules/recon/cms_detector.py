from __future__ import annotations

import asyncio
import re
import aiohttp
from typing import AsyncGenerator

TIMEOUT = aiohttp.ClientTimeout(total=15)
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

CMS_PATHS = {
    "WordPress": ["/wp-login.php", "/wp-content/", "/wp-includes/", "/wp-json/wp/v2/"],
    "Drupal": ["/sites/default/", "/core/misc/drupal.js", "/user/login"],
    "Joomla": ["/administrator/", "/components/com_content/", "/templates/system/"],
    "Magento": ["/skin/frontend/", "/js/mage/", "/index.php/admin/"],
    "PrestaShop": ["/modules/", "/themes/default-bootstrap/"],
    "TYPO3": ["/typo3/", "/typo3conf/"],
    "Ghost": ["/ghost/api/", "/content/themes/"],
    "Shopify": ["/cdn/shop/", "/checkouts/"],
}

CMS_BODY_PATTERNS = {
    "WordPress": [
        r"wp-content",
        r"wp-includes",
        r"/wp-json/",
        r'<meta[^>]+generator[^>]+WordPress',
        r"wordpress",
    ],
    "Drupal": [
        r"Drupal\.settings",
        r"/sites/default/files/",
        r"drupal\.js",
        r'<meta[^>]+generator[^>]+Drupal',
    ],
    "Joomla": [
        r"/components/com_",
        r"Joomla!",
        r'<meta[^>]+generator[^>]+Joomla',
        r"joomla",
    ],
    "Laravel": [
        r"laravel_session",
        r"XSRF-TOKEN",
        r"Laravel",
    ],
    "Django": [
        r"csrfmiddlewaretoken",
        r"django",
        r"__django_",
    ],
    "Next.js": [
        r"__NEXT_DATA__",
        r"/_next/static/",
        r"next\.js",
    ],
    "Nuxt.js": [
        r"__nuxt",
        r"/_nuxt/",
        r"nuxt\.js",
    ],
    "Ghost": [
        r"content\.ghost\.io",
        r"ghost-url",
        r'"ghost"',
    ],
    "Magento": [
        r"/skin/frontend/",
        r"Mage\.Cookies",
        r"magento",
    ],
    "Shopify": [
        r"Shopify\.theme",
        r"cdn\.shopify\.com",
        r"shopify",
    ],
}

CMS_COOKIES = {
    "WordPress": ["wordpress_", "wp-settings-", "wp_"],
    "Joomla": ["joomla_user_state", "joomla_"],
    "Laravel": ["laravel_session"],
    "Django": ["sessionid", "csrftoken"],
    "Drupal": ["Drupal_visitor_", "SESS"],
}

CMS_HEADERS = {
    "WordPress": [("x-wp-nonce", None), ("link", "wp-json")],
    "Drupal": [("x-generator", "drupal"), ("x-drupal-cache", None)],
    "Ghost": [("x-ghost-", None)],
}


async def _check_path(session: aiohttp.ClientSession, base_url: str, path: str) -> tuple[bool, int]:
    url = base_url.rstrip("/") + path
    try:
        async with session.get(url, allow_redirects=True, ssl=False) as resp:
            return resp.status not in (404, 410), resp.status
    except Exception:
        return False, 0


async def cms_detect(url: str) -> AsyncGenerator:
    yield {"type": "info", "message": f"Starting CMS detection on {url}"}

    detected: list[str] = []
    base_url = url.rstrip("/")

    try:
        async with aiohttp.ClientSession(timeout=TIMEOUT, headers=HEADERS) as session:
            # Step 1: Fetch main page
            yield {"type": "progress", "message": "Fetching main page..."}
            try:
                async with session.get(url, allow_redirects=True, ssl=False) as resp:
                    status = resp.status
                    body = await resp.text(errors="replace")
                    resp_headers = {k.lower(): v for k, v in resp.headers.items()}
                    cookies = {c.key.lower(): c.value for c in resp.cookies.values()}

                    yield {"type": "info", "message": f"HTTP {status} | {len(body)} bytes"}

                    # Server / X-Powered-By headers
                    server = resp_headers.get("server", "")
                    powered_by = resp_headers.get("x-powered-by", "")
                    x_generator = resp_headers.get("x-generator", "")

                    if server:
                        yield {"type": "data", "message": f"[Header] Server: {server}"}
                    if powered_by:
                        yield {"type": "data", "message": f"[Header] X-Powered-By: {powered_by}"}
                    if x_generator:
                        yield {"type": "data", "message": f"[Header] X-Generator: {x_generator}"}

                    # CMS-specific headers
                    for cms_name, checks in CMS_HEADERS.items():
                        for header, contains in checks:
                            for h_key, h_val in resp_headers.items():
                                if h_key.startswith(header) or h_key == header:
                                    if contains is None or contains.lower() in h_val.lower():
                                        if cms_name not in detected:
                                            detected.append(cms_name)
                                            yield {
                                                "type": "found",
                                                "cms": cms_name,
                                                "method": "header",
                                                "message": f"[CMS] {cms_name} detected via header: {h_key}: {h_val}",
                                            }

                    # Cookie analysis
                    for cms_name, cookie_patterns in CMS_COOKIES.items():
                        for pattern in cookie_patterns:
                            for cookie_name in cookies:
                                if pattern.lower() in cookie_name.lower():
                                    if cms_name not in detected:
                                        detected.append(cms_name)
                                        yield {
                                            "type": "found",
                                            "cms": cms_name,
                                            "method": "cookie",
                                            "message": f"[CMS] {cms_name} detected via cookie: {cookie_name}",
                                        }

                    # Body pattern analysis
                    body_lower = body.lower()
                    for cms_name, patterns in CMS_BODY_PATTERNS.items():
                        for pattern in patterns:
                            if re.search(pattern, body, re.IGNORECASE):
                                if cms_name not in detected:
                                    detected.append(cms_name)
                                    yield {
                                        "type": "found",
                                        "cms": cms_name,
                                        "method": "body",
                                        "message": f"[CMS] {cms_name} detected via body pattern",
                                    }
                                break

                    # Meta generator tag
                    gen_match = re.search(
                        r'<meta[^>]+name=["\']generator["\'][^>]+content=["\']([^"\']+)["\']',
                        body, re.IGNORECASE
                    )
                    if gen_match:
                        gen_val = gen_match.group(1)
                        yield {
                            "type": "found",
                            "method": "meta",
                            "generator": gen_val,
                            "message": f"[Meta] Generator tag: {gen_val}",
                        }

            except aiohttp.ClientError as e:
                yield {"type": "error", "message": f"Failed to fetch main page: {e}"}
                return

            # Step 2: Probe CMS-specific paths
            yield {"type": "progress", "message": "Probing CMS-specific paths..."}
            for cms_name, paths in CMS_PATHS.items():
                for path in paths:
                    exists, path_status = await _check_path(session, base_url, path)
                    if exists:
                        if cms_name not in detected:
                            detected.append(cms_name)
                        yield {
                            "type": "found",
                            "cms": cms_name,
                            "path": path,
                            "status": path_status,
                            "method": "path",
                            "message": f"[CMS] {cms_name} — path exists: {path} (HTTP {path_status})",
                        }
                    await asyncio.sleep(0.1)

    except Exception as e:
        yield {"type": "error", "message": f"CMS detection error: {e}"}
        return

    if detected:
        yield {
            "type": "found",
            "cms_list": detected,
            "message": f"[Summary] CMS/Framework(s) detected: {', '.join(detected)}",
        }
    else:
        yield {"type": "info", "message": "No CMS fingerprints detected"}

    yield {"type": "done", "message": "CMS detection complete"}
