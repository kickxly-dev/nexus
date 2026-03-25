import httpx
import asyncio
import socket
from typing import List


# Known CNAME → service fingerprint map
TAKEOVER_FINGERPRINTS = {
    'github.io':            ("There isn't a GitHub Pages site here",       'GitHub Pages'),
    'amazonaws.com':        ('NoSuchBucket',                                'AWS S3'),
    's3.amazonaws.com':     ('NoSuchBucket',                                'AWS S3'),
    'cloudfront.net':       ('The request could not be satisfied',          'CloudFront'),
    'herokudns.com':        ('No such app',                                  'Heroku'),
    'herokuapp.com':        ('No such app',                                  'Heroku'),
    'shopify.com':          ('Sorry, this shop is currently unavailable',    'Shopify'),
    'shopifypreview.com':   ('Sorry, this shop is currently unavailable',    'Shopify'),
    'azure-api.net':        ('Oops. Something went wrong',                   'Azure API'),
    'azurewebsites.net':    ('404 Web Site not found',                       'Azure Web'),
    'blob.core.windows.net':('The specified container does not exist',       'Azure Blob'),
    'cloudapp.net':         ('404 Not Found',                                'Azure Cloud'),
    'trafficmanager.net':   ('404 Not Found',                                'Azure Traffic'),
    'fastly.net':           ('Fastly error: unknown domain',                 'Fastly'),
    'pantheonsite.io':      ('The gods are wise',                            'Pantheon'),
    'wpengine.com':         ('The site you were looking for couldn\'t be found', 'WP Engine'),
    'zendesk.com':          ("Help Center Closed",                           'Zendesk'),
    'desk.com':             ('Sorry, We Couldn\'t Find That Page',           'Desk.com'),
    'helpjuice.com':        ('We could not find what you\'re looking for',   'HelpJuice'),
    'helpscoutdocs.com':    ('No settings were found for this company',      'HelpScout'),
    'ghost.io':             ('The thing you were looking for is no longer here', 'Ghost'),
    'surge.sh':             ('project not found',                             'Surge'),
    'bitbucket.io':         ('Repository not found',                          'Bitbucket'),
    'tumblr.com':           ('Whatever you were looking for doesn\'t currently exist', 'Tumblr'),
    'uservoice.com':        ('This UserVoice subdomain is currently available', 'UserVoice'),
}


async def _resolve_cname(domain: str):
    try:
        import dns.resolver
        answers = dns.resolver.resolve(domain, 'CNAME')
        return [str(r.target).rstrip('.') for r in answers]
    except Exception:
        return []


async def _http_body(url: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=8, verify=False, follow_redirects=True) as c:
            r = await c.get(url)
            return r.text[:5000]
    except Exception:
        return ''


async def subdomain_takeover(domain: str, subdomains: List[str] = None):
    # Default wordlist of common subdomains
    default_subs = [
        'www', 'mail', 'blog', 'shop', 'store', 'api', 'dev', 'staging',
        'test', 'demo', 'admin', 'cdn', 'static', 'assets', 'media',
        'img', 'images', 'app', 'portal', 'support', 'docs', 'help',
        'status', 'beta', 'alpha', 'old', 'new', 'login', 'auth',
        'beta', 'vpn', 'remote', 'secure', 'web', 'mobile',
    ]
    targets = subdomains if subdomains else default_subs

    yield {'type': 'info', 'message': f'Domain: {domain}'}
    yield {'type': 'info', 'message': f'Checking {len(targets)} subdomains for takeover vectors'}
    yield {'type': 'info', 'message': '─' * 44}

    found = 0
    checked = 0

    async def check_sub(sub):
        nonlocal found, checked
        fqdn = f'{sub}.{domain}'
        checked += 1

        # Check if subdomain resolves
        try:
            socket.gethostbyname(fqdn)
        except socket.gaierror:
            # NXDOMAIN — dangling? Check if CNAME exists but host is gone
            cnames = await _resolve_cname(fqdn)
            if cnames:
                for cname in cnames:
                    for fingerprint, (error_text, service) in TAKEOVER_FINGERPRINTS.items():
                        if fingerprint in cname:
                            found += 1
                            return {'type': 'vuln', 'level': 'HIGH',
                                    'sub': fqdn, 'cname': cname, 'service': service}
            return None

        # Subdomain resolves — check if page shows takeover fingerprint
        body = await _http_body(f'http://{fqdn}')
        if not body:
            body = await _http_body(f'https://{fqdn}')

        cnames = await _resolve_cname(fqdn)
        for cname in cnames:
            for fingerprint, (error_text, service) in TAKEOVER_FINGERPRINTS.items():
                if fingerprint in cname:
                    if error_text.lower() in body.lower():
                        found += 1
                        return {'type': 'vuln', 'level': 'CONFIRMED',
                                'sub': fqdn, 'cname': cname, 'service': service}
                    else:
                        return {'type': 'warn', 'level': 'POSSIBLE',
                                'sub': fqdn, 'cname': cname, 'service': service}
        return None

    tasks = [check_sub(sub) for sub in targets]
    results = await asyncio.gather(*tasks)

    for r in results:
        if r is None:
            continue
        if r['type'] == 'vuln':
            yield {'type': 'vuln', 'message': f'[{r["level"]}] {r["sub"]}'}
            yield {'type': 'data', 'message': f'  CNAME   → {r["cname"]}'}
            yield {'type': 'data', 'message': f'  Service : {r["service"]}'}
        elif r['type'] == 'warn':
            yield {'type': 'warn', 'message': f'[{r["level"]}] {r["sub"]} → {r["cname"]} ({r["service"]})'}

    if found == 0:
        yield {'type': 'found', 'message': 'No subdomain takeover vulnerabilities detected'}
    else:
        yield {'type': 'vuln', 'message': f'{found} takeover vector(s) found!'}

    yield {'type': 'done', 'message': f'Checked {checked} subdomains'}
