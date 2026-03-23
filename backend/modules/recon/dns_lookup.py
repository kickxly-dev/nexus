import asyncio
import dns.asyncresolver
import dns.exception
from typing import AsyncGenerator

RECORD_TYPES = ["A", "AAAA", "MX", "NS", "TXT", "CNAME", "SOA"]


async def dns_lookup(domain: str) -> AsyncGenerator:
    resolver = dns.asyncresolver.Resolver()
    resolver.timeout = 5
    resolver.lifetime = 5

    yield {"type": "info", "message": f"Querying DNS records for {domain}..."}

    for rtype in RECORD_TYPES:
        try:
            answers = await resolver.resolve(domain, rtype)
            records = []
            for r in answers:
                records.append(r.to_text())
            yield {
                "type": "found",
                "record_type": rtype,
                "records": records,
                "message": f"[{rtype}] {', '.join(records)}",
            }
        except dns.resolver.NoAnswer:
            yield {"type": "empty", "record_type": rtype, "message": f"[{rtype}] No records"}
        except dns.resolver.NXDOMAIN:
            yield {"type": "error", "message": f"Domain {domain} does not exist"}
            return
        except dns.exception.DNSException as e:
            yield {"type": "warn", "record_type": rtype, "message": f"[{rtype}] Error: {e}"}

    yield {"type": "done", "message": "DNS lookup complete"}
