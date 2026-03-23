import ssl
import socket
import datetime
import asyncio

async def ssl_inspect(hostname: str, port: int = 443):
    hostname = hostname.replace("https://", "").replace("http://", "").split("/")[0]
    yield {"type": "info", "message": f"Inspecting SSL certificate for {hostname}:{port}..."}

    try:
        ctx = ssl.create_default_context()
        def get_cert():
            with socket.create_connection((hostname, port), timeout=10) as sock:
                with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                    return ssock.getpeercert(), ssock.version(), ssock.cipher()

        cert, version, cipher = await asyncio.to_thread(get_cert)

        # Basic info
        subject = dict(x[0] for x in cert.get("subject", []))
        issuer  = dict(x[0] for x in cert.get("issuer", []))

        yield {"type": "found", "message": f"Subject CN: {subject.get('commonName', 'N/A')}"}
        yield {"type": "found", "message": f"Issuer: {issuer.get('organizationName', 'N/A')} / {issuer.get('commonName', 'N/A')}"}
        yield {"type": "found", "message": f"TLS Version: {version}"}
        yield {"type": "found", "message": f"Cipher: {cipher[0]} ({cipher[2]} bits)"}

        # Expiry
        not_before = datetime.datetime.strptime(cert["notBefore"], "%b %d %H:%M:%S %Y %Z")
        not_after  = datetime.datetime.strptime(cert["notAfter"],  "%b %d %H:%M:%S %Y %Z")
        days_left  = (not_after - datetime.datetime.utcnow()).days

        yield {"type": "found", "message": f"Valid from: {not_before.date()}"}
        yield {"type": "found", "message": f"Valid until: {not_after.date()} ({days_left} days remaining)"}

        if days_left < 0:
            yield {"type": "vuln", "message": "EXPIRED: Certificate has expired!"}
        elif days_left < 30:
            yield {"type": "warn", "message": f"EXPIRING SOON: Only {days_left} days left"}
        else:
            yield {"type": "found", "message": "Certificate is valid and not expiring soon"}

        # SANs
        sans = cert.get("subjectAltName", [])
        if sans:
            yield {"type": "info", "message": f"SANs ({len(sans)}):"}
            for san_type, san_val in sans[:20]:
                yield {"type": "data", "message": f"  {san_type}: {san_val}"}

        # TLS version warnings
        if version in ("TLSv1", "TLSv1.1", "SSLv3", "SSLv2"):
            yield {"type": "vuln", "message": f"INSECURE: {version} is deprecated and vulnerable"}
        elif version == "TLSv1.2":
            yield {"type": "warn", "message": "TLS 1.2 is acceptable but TLS 1.3 is preferred"}
        else:
            yield {"type": "found", "message": f"TLS 1.3 in use — excellent"}

        # Cipher strength
        if cipher[2] and cipher[2] < 128:
            yield {"type": "vuln", "message": f"WEAK CIPHER: Only {cipher[2]} bit key"}

        yield {"type": "result", "message": f"Certificate inspection complete — {days_left} days remaining"}

    except ssl.SSLCertVerificationError as e:
        yield {"type": "vuln", "message": f"CERT VERIFICATION FAILED: {e}"}
    except Exception as e:
        yield {"type": "error", "message": str(e)}
