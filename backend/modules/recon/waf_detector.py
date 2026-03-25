from __future__ import annotations

import asyncio
import aiohttp
from typing import AsyncGenerator

WAF_PAYLOADS = [
    "?id=1'",
    "?q=<script>alert(1)</script>",
    "?file=../etc/passwd",
    "?cmd=;ls",
    "?search=UNION+SELECT+1,2,3--",
]

WAF_HEADERS = {
    "cloudflare": [
        ("cf-ray", None),
        ("server", "cloudflare"),
    ],
    "akamai": [
        ("x-check-cacheable", None),
        ("x-akamai-transformed", None),
        ("akamai-origin-hop", None),
    ],
    "aws_waf": [
        ("x-amzn-requestid", None),
        ("x-amzn-trace-id", None),
        ("x-amz-cf-id", None),
    ],
    "sucuri": [
        ("x-sucuri-id", None),
        ("x-sucuri-cache", None),
    ],
    "imperva": [
        ("x-iinfo", None),
        ("x-cdn", "imperva"),
        ("x-cdn-forward", None),
    ],
    "f5_big_ip": [
        ("x-wa-info", None),
        ("x-cnection", None),
    ],
    "barracuda": [
        ("barra_counter_session", None),
    ],
    "fortinet": [
        ("x-fw-debug", None),
    ],
}

WAF_BODY_SIGNATURES = {
    "modsecurity": ["mod_security", "modsecurity", "NOYB", "not acceptable"],
    "cloudflare": ["cloudflare ray id", "cloudflare", "cf-ray"],
    "sucuri": ["sucuri website firewall", "access denied - sucuri"],
    "imperva": ["imperva", "incapsula incident id"],
    "barracuda": ["barracuda networks", "you have been blocked"],
    "f5_big_ip": ["the requested url was rejected", "reference id:"],
}

TIMEOUT = aiohttp.ClientTimeout(total=15)
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}


async def waf_detect(url: str) -> AsyncGenerator:
    yield {"type": "info", "message": f"Starting WAF detection on {url}"}

    detected_wafs: list[str] = []

    try:
        async with aiohttp.ClientSession(timeout=TIMEOUT, headers=HEADERS) as session:
            # Step 1: Baseline request — check headers on clean request
            yield {"type": "progress", "message": "Checking response headers on baseline request..."}
            try:
                async with session.get(url, allow_redirects=True, ssl=False) as resp:
                    baseline_headers = {k.lower(): v.lower() for k, v in resp.headers.items()}
                    baseline_status = resp.status
                    yield {"type": "info", "message": f"Baseline response: HTTP {baseline_status}"}

                    for waf_name, checks in WAF_HEADERS.items():
                        for header, expected_value in checks:
                            if header in baseline_headers:
                                actual = baseline_headers[header]
                                if expected_value is None or expected_value.lower() in actual:
                                    if waf_name not in detected_wafs:
                                        detected_wafs.append(waf_name)
                                        yield {
                                            "type": "found",
                                            "waf": waf_name,
                                            "header": header,
                                            "value": baseline_headers[header],
                                            "message": f"[WAF] {waf_name.upper()} detected via header: {header}: {baseline_headers[header]}",
                                        }
            except aiohttp.ClientError as e:
                yield {"type": "warn", "message": f"Baseline request failed: {e}"}

            # Step 2: Send triggering payloads
            yield {"type": "progress", "message": "Sending WAF-triggering payloads..."}
            for payload in WAF_PAYLOADS:
                test_url = url.rstrip("/") + payload
                try:
                    async with session.get(test_url, allow_redirects=False, ssl=False) as resp:
                        status = resp.status
                        resp_headers = {k.lower(): v.lower() for k, v in resp.headers.items()}
                        body = ""
                        try:
                            body = (await resp.text(errors="replace")).lower()[:2000]
                        except Exception:
                            pass

                        # Check for WAF-style block responses
                        if status in (403, 406, 429, 501, 503):
                            yield {
                                "type": "warn",
                                "payload": payload,
                                "status": status,
                                "message": f"[Blocked] Payload {payload!r} returned HTTP {status} — possible WAF block",
                            }

                        # Check headers on triggered response
                        for waf_name, checks in WAF_HEADERS.items():
                            for header, expected_value in checks:
                                if header in resp_headers:
                                    actual = resp_headers[header]
                                    if expected_value is None or expected_value.lower() in actual:
                                        if waf_name not in detected_wafs:
                                            detected_wafs.append(waf_name)
                                            yield {
                                                "type": "found",
                                                "waf": waf_name,
                                                "header": header,
                                                "payload": payload,
                                                "message": f"[WAF] {waf_name.upper()} detected via triggered header: {header}",
                                            }

                        # Check body for WAF signatures
                        for waf_name, sigs in WAF_BODY_SIGNATURES.items():
                            for sig in sigs:
                                if sig in body:
                                    if waf_name not in detected_wafs:
                                        detected_wafs.append(waf_name)
                                        yield {
                                            "type": "vuln",
                                            "waf": waf_name,
                                            "signature": sig,
                                            "payload": payload,
                                            "message": f"[WAF] {waf_name.upper()} detected via body signature: '{sig}'",
                                        }
                                    break

                except asyncio.TimeoutError:
                    yield {"type": "warn", "message": f"Timeout on payload {payload!r} — possible WAF rate limiting"}
                except aiohttp.ClientError as e:
                    yield {"type": "warn", "message": f"Request error for {payload!r}: {e}"}

                await asyncio.sleep(0.3)

    except Exception as e:
        yield {"type": "error", "message": f"WAF detection error: {e}"}
        return

    if detected_wafs:
        yield {
            "type": "found",
            "wafs": detected_wafs,
            "message": f"[Summary] WAF(s) detected: {', '.join(w.upper() for w in detected_wafs)}",
        }
    else:
        yield {"type": "info", "message": "No WAF fingerprints detected (target may use custom WAF or none)"}

    yield {"type": "done", "message": "WAF detection complete"}
