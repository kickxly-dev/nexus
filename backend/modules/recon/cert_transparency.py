import httpx
import json


async def cert_transparency(domain: str):
    yield {"type": "info", "message": f"Querying crt.sh for *.{domain}..."}

    url = f"https://crt.sh/?q=%25.{domain}&output=json"

    try:
        async with httpx.AsyncClient(timeout=10, verify=False) as client:
            response = await client.get(url, headers={"Accept": "application/json"})
            response.raise_for_status()
    except httpx.TimeoutException:
        yield {"type": "error", "message": "Request to crt.sh timed out."}
        return
    except httpx.HTTPStatusError as e:
        yield {"type": "error", "message": f"crt.sh returned HTTP {e.response.status_code}."}
        return
    except Exception as e:
        yield {"type": "error", "message": f"Request failed: {e}"}
        return

    try:
        data = response.json()
    except Exception:
        yield {"type": "error", "message": "Failed to parse crt.sh JSON response."}
        return

    if not data:
        yield {"type": "warn", "message": f"No certificates found for {domain}."}
        yield {"type": "done", "message": "Certificate transparency lookup complete."}
        return

    yield {"type": "info", "message": f"Found {len(data)} certificate entries. Deduplicating subdomains..."}

    seen: set[str] = set()
    # subdomain -> list of (issuer, not_before, not_after)
    subdomain_meta: dict[str, dict] = {}

    for entry in data:
        name_value: str = entry.get("name_value", "")
        issuer: str = entry.get("issuer_name", "")
        not_before: str = entry.get("not_before", "")
        not_after: str = entry.get("not_after", "")

        for sub in name_value.splitlines():
            sub = sub.strip().lower()
            if not sub or sub in seen:
                continue
            # Skip wildcard entries but record the base
            if sub.startswith("*."):
                sub = sub[2:]
            if not sub.endswith(f".{domain}") and sub != domain:
                continue
            seen.add(sub)
            subdomain_meta[sub] = {
                "issuer": issuer,
                "not_before": not_before,
                "not_after": not_after,
            }

    if not seen:
        yield {"type": "warn", "message": "No valid subdomains extracted from certificate data."}
        yield {"type": "done", "message": "Certificate transparency lookup complete."}
        return

    sorted_subs = sorted(seen)[:200]

    for sub in sorted_subs:
        meta = subdomain_meta[sub]
        issuer_short = meta["issuer"]
        # Extract CN= from issuer string if present
        for part in meta["issuer"].split(","):
            part = part.strip()
            if part.startswith("CN="):
                issuer_short = part[3:]
                break

        not_before = meta["not_before"][:10] if meta["not_before"] else "?"
        not_after = meta["not_after"][:10] if meta["not_after"] else "?"

        yield {
            "type": "found",
            "message": f"{sub}  |  Issuer: {issuer_short}  |  Valid: {not_before} → {not_after}",
        }

    capped = " (capped at 200)" if len(seen) > 200 else ""
    yield {
        "type": "done",
        "message": f"Found {len(sorted_subs)} unique subdomains{capped} via certificate transparency.",
    }
