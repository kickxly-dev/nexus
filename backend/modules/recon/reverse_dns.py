import dns.resolver
import dns.reversename

async def reverse_dns(ip: str):
    yield {"type": "info", "message": f"Reverse DNS lookup for {ip}..."}
    try:
        rev_name = dns.reversename.from_address(ip)
        answers = dns.resolver.resolve(rev_name, "PTR")
        for rdata in answers:
            yield {"type": "found", "message": f"PTR: {rdata.to_text()}"}
        if not answers:
            yield {"type": "warn", "message": "No PTR records found"}
    except dns.resolver.NXDOMAIN:
        yield {"type": "warn", "message": "No PTR record exists for this IP"}
    except Exception as e:
        yield {"type": "error", "message": str(e)}
