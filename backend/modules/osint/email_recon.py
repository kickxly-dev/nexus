import re
import dns.resolver
import httpx

DISPOSABLE_DOMAINS = {
    "mailinator.com","guerrillamail.com","tempmail.com","throwaway.email",
    "sharklasers.com","guerrillamailblock.com","grr.la","guerrillamail.info",
    "spam4.me","yopmail.com","trashmail.com","maildrop.cc","10minutemail.com",
    "dispostable.com","fakeinbox.com","mailnull.com","spamgourmet.com",
}

async def email_recon(email: str):
    yield {"type": "info", "message": f"Investigating email: {email}"}

    # Format validation
    pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        yield {"type": "error", "message": "Invalid email format"}
        return

    local, domain = email.rsplit("@", 1)
    yield {"type": "found", "message": f"Local part: {local}"}
    yield {"type": "found", "message": f"Domain: {domain}"}

    # Disposable check
    if domain.lower() in DISPOSABLE_DOMAINS:
        yield {"type": "vuln", "message": f"DISPOSABLE: {domain} is a known disposable email provider"}
    else:
        yield {"type": "info", "message": f"Domain {domain} not in disposable list"}

    # MX records
    yield {"type": "info", "message": "Checking MX records..."}
    try:
        mx_records = dns.resolver.resolve(domain, "MX")
        for mx in sorted(mx_records, key=lambda r: r.preference):
            yield {"type": "found", "message": f"MX [{mx.preference}]: {mx.exchange}"}
        yield {"type": "result", "message": f"Mail server count: {len(list(mx_records))}"}
    except dns.resolver.NXDOMAIN:
        yield {"type": "warn", "message": "No MX records — domain may not accept email"}
    except Exception as e:
        yield {"type": "error", "message": f"MX lookup failed: {e}"}

    # A record
    try:
        a_records = dns.resolver.resolve(domain, "A")
        for r in a_records:
            yield {"type": "found", "message": f"A record: {r.address}"}
    except Exception:
        pass

    # SPF / DMARC
    for rtype, label in [("TXT", "SPF/TXT"), ("TXT", "DMARC")]:
        try:
            qname = f"_dmarc.{domain}" if label == "DMARC" else domain
            records = dns.resolver.resolve(qname, "TXT")
            for r in records:
                text = r.to_text().strip('"')
                if label == "DMARC" or "v=spf" in text.lower():
                    yield {"type": "found", "message": f"{label}: {text[:120]}"}
        except Exception:
            pass
