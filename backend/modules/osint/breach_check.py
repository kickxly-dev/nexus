import hashlib
import httpx

async def breach_check(password: str):
    """Check if a password has appeared in known data breaches using k-anonymity (HIBP)."""
    yield {"type": "info", "message": "Checking password against known breach databases..."}
    yield {"type": "info", "message": "Using k-anonymity — password never leaves your machine"}

    sha1 = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                f"https://api.pwnedpasswords.com/range/{prefix}",
                headers={"Add-Padding": "true"}
            )
            if res.status_code != 200:
                yield {"type": "error", "message": f"HIBP API returned {res.status_code}"}
                return

            lines = res.text.splitlines()
            count = 0
            for line in lines:
                if ":" in line:
                    h, c = line.split(":", 1)
                    if h.upper() == suffix:
                        count = int(c)
                        break

            if count > 0:
                yield {"type": "vuln", "message": f"PWNED: This password appeared {count:,} times in data breaches!"}
                if count > 100000:
                    yield {"type": "vuln", "message": "CRITICAL: Extremely common compromised password — change immediately"}
                elif count > 1000:
                    yield {"type": "vuln", "message": "HIGH RISK: Very common in breach databases"}
                else:
                    yield {"type": "warn", "message": "LOW FREQUENCY: Found in breaches but not widespread"}
                yield {"type": "result", "message": f"Breach count: {count:,}"}
            else:
                yield {"type": "found", "message": "NOT PWNED: Password not found in known breach databases"}
                yield {"type": "result", "message": "This password appears safe from known breaches"}

    except Exception as e:
        yield {"type": "error", "message": f"HIBP check failed: {e}"}
