import asyncio
import socket
import re
from typing import AsyncGenerator

COMMON_PORTS = {
    21: "FTP",
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    143: "IMAP",
    443: "HTTPS",
    445: "SMB",
    3306: "MySQL",
    3389: "RDP",
    5432: "PostgreSQL",
    5900: "VNC",
    6379: "Redis",
    8080: "HTTP-Alt",
    8443: "HTTPS-Alt",
    9200: "Elasticsearch",
    27017: "MongoDB",
}


async def grab_banner(host: str, port: int, timeout: float = 3.0) -> str:
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(host, port), timeout=timeout
        )
        # Send HTTP probe for web ports
        if port in (80, 8080, 8000):
            writer.write(b"GET / HTTP/1.0\r\nHost: " + host.encode() + b"\r\n\r\n")
        elif port == 443:
            writer.close()
            return "HTTPS (TLS)"

        try:
            banner = await asyncio.wait_for(reader.read(1024), timeout=timeout)
            writer.close()
            return banner.decode("utf-8", errors="replace").strip()
        except asyncio.TimeoutError:
            writer.close()
            return "Connected (no banner)"
    except Exception:
        return None


async def detect_services(host: str, ports: list = None) -> AsyncGenerator:
    if not ports:
        ports = list(COMMON_PORTS.keys())

    yield {"type": "info", "message": f"Detecting services on {host} ({len(ports)} ports)..."}

    sem = asyncio.Semaphore(20)

    async def check_port(port):
        async with sem:
            service_name = COMMON_PORTS.get(port, "unknown")
            banner = await grab_banner(host, port)
            if banner is not None:
                # Clean banner
                clean = re.sub(r"[\x00-\x08\x0b-\x1f\x7f-\xff]", ".", banner)[:120]
                return {
                    "type": "found",
                    "host": host,
                    "port": port,
                    "service": service_name,
                    "banner": clean,
                    "message": f"[OPEN] {port}/{service_name}: {clean}" if clean else f"[OPEN] {port}/{service_name}",
                }
            return None

    tasks = [check_port(p) for p in ports]
    for coro in asyncio.as_completed(tasks):
        result = await coro
        if result:
            yield result

    yield {"type": "done", "message": "Service detection complete"}
