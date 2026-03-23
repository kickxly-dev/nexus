import asyncio
import whois
from typing import AsyncGenerator


async def whois_lookup(domain: str) -> AsyncGenerator:
    yield {"type": "info", "message": f"Running WHOIS lookup for {domain}..."}

    try:
        result = await asyncio.to_thread(whois.whois, domain)

        fields = {
            "Domain Name": result.domain_name,
            "Registrar": result.registrar,
            "Creation Date": str(result.creation_date),
            "Expiration Date": str(result.expiration_date),
            "Updated Date": str(result.updated_date),
            "Name Servers": result.name_servers,
            "Status": result.status,
            "Emails": result.emails,
            "DNSSEC": result.dnssec,
            "Org": result.org,
            "Country": result.country,
        }

        for key, value in fields.items():
            if value:
                if isinstance(value, list):
                    value = ", ".join(str(v) for v in value if v)
                yield {
                    "type": "found",
                    "field": key,
                    "value": str(value),
                    "message": f"{key}: {value}",
                }

        yield {"type": "done", "message": "WHOIS lookup complete"}

    except Exception as e:
        yield {"type": "error", "message": f"WHOIS error: {str(e)}"}
