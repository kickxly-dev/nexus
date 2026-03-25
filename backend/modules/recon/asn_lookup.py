import httpx
import re


async def asn_lookup(target: str):
    yield {'type': 'info', 'message': f'ASN Lookup: {target}'}

    # Try bgpview.io API
    async with httpx.AsyncClient(timeout=15) as client:
        # Determine if IP or ASN
        is_asn = target.upper().startswith('AS')
        is_ip = bool(re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', target))

        if is_ip:
            yield {'type': 'info', 'message': 'Mode: IP → ASN lookup'}
            try:
                r = await client.get(f'https://api.bgpview.io/ip/{target}')
                d = r.json()
                if d.get('status') == 'ok':
                    data = d.get('data', {})
                    prefixes = data.get('prefixes', [])
                    rir = data.get('rir_allocation', {})
                    yield {'type': 'result', 'message': f'IP            : {target}'}
                    if rir:
                        yield {'type': 'result', 'message': f'RIR           : {rir.get("rir_name","?")}'}
                        yield {'type': 'result', 'message': f'Allocated     : {rir.get("date_allocated","?")}'}
                        yield {'type': 'result', 'message': f'Prefix        : {rir.get("prefix","?")}'}
                    for p in prefixes[:5]:
                        asn = p.get('asn', {})
                        yield {'type': 'found', 'message': f'ASN           : AS{asn.get("asn","")} — {asn.get("name","?")}'}
                        yield {'type': 'data',  'message': f'  Prefix      : {p.get("prefix","?")}'}
                        yield {'type': 'data',  'message': f'  Country     : {asn.get("country_code","?")}'}
                        yield {'type': 'data',  'message': f'  Description : {p.get("description","?")}'}
                else:
                    yield {'type': 'warn', 'message': 'No ASN data found for this IP'}
            except Exception as e:
                yield {'type': 'error', 'message': f'bgpview.io error: {e}'}

        elif is_asn:
            asn_num = target.upper().replace('AS', '')
            yield {'type': 'info', 'message': f'Mode: ASN details lookup (AS{asn_num})'}
            try:
                r = await client.get(f'https://api.bgpview.io/asn/{asn_num}')
                d = r.json()
                if d.get('status') == 'ok':
                    data = d.get('data', {})
                    yield {'type': 'result', 'message': f'ASN           : AS{data.get("asn","")}'}
                    yield {'type': 'result', 'message': f'Name          : {data.get("name","?")}'}
                    yield {'type': 'result', 'message': f'Description   : {data.get("description_short","?")}'}
                    yield {'type': 'result', 'message': f'Country       : {data.get("country_code","?")}'}
                    yield {'type': 'result', 'message': f'RIR           : {data.get("rir_allocation",{}).get("rir_name","?")}'}
                    email_contacts = data.get('email_contacts', [])
                    if email_contacts:
                        for e in email_contacts[:3]:
                            yield {'type': 'data', 'message': f'Email         : {e}'}

                    # Prefixes
                    r2 = await client.get(f'https://api.bgpview.io/asn/{asn_num}/prefixes')
                    d2 = r2.json()
                    if d2.get('status') == 'ok':
                        ipv4 = d2['data'].get('ipv4_prefixes', [])
                        ipv6 = d2['data'].get('ipv6_prefixes', [])
                        yield {'type': 'info', 'message': f'IPv4 Prefixes : {len(ipv4)} announced'}
                        yield {'type': 'info', 'message': f'IPv6 Prefixes : {len(ipv6)} announced'}
                        for p in ipv4[:10]:
                            yield {'type': 'found', 'message': f'  {p.get("prefix","?")} — {p.get("name","?")}'}
                else:
                    yield {'type': 'warn', 'message': 'ASN not found'}
            except Exception as e:
                yield {'type': 'error', 'message': f'bgpview.io error: {e}'}
        else:
            # Domain → resolve → ASN
            yield {'type': 'info', 'message': 'Mode: Domain → IP → ASN lookup'}
            try:
                import socket
                ip = socket.gethostbyname(target)
                yield {'type': 'data', 'message': f'Resolved      : {target} → {ip}'}
                r = await client.get(f'https://api.bgpview.io/ip/{ip}')
                d = r.json()
                if d.get('status') == 'ok':
                    prefixes = d['data'].get('prefixes', [])
                    for p in prefixes[:3]:
                        asn = p.get('asn', {})
                        yield {'type': 'found', 'message': f'ASN           : AS{asn.get("asn","")} — {asn.get("name","?")}'}
                        yield {'type': 'data',  'message': f'  Country     : {asn.get("country_code","?")}'}
                        yield {'type': 'data',  'message': f'  Prefix      : {p.get("prefix","?")}'}
            except Exception as e:
                yield {'type': 'error', 'message': f'Lookup failed: {e}'}

    yield {'type': 'done', 'message': 'ASN lookup complete'}
