import asyncio
import nmap
from typing import AsyncGenerator


async def port_scan(target: str, ports: str = "1-1000", scan_type: str = "tcp") -> AsyncGenerator:
    yield {"type": "info", "message": f"Scanning {target} ports {ports} ({scan_type})..."}

    args = "-sV --open"
    if scan_type == "syn":
        args = "-sS -sV --open"
    elif scan_type == "udp":
        args = "-sU --open"

    try:
        nm = nmap.PortScanner()
        result = await asyncio.to_thread(nm.scan, target, ports, arguments=args)

        for host in nm.all_hosts():
            yield {"type": "info", "message": f"Host: {host} ({nm[host].hostname()}) - {nm[host].state()}"}

            for proto in nm[host].all_protocols():
                port_list = sorted(nm[host][proto].keys())
                for port in port_list:
                    data = nm[host][proto][port]
                    service = data.get("name", "unknown")
                    version = data.get("version", "")
                    product = data.get("product", "")
                    state = data.get("state", "unknown")

                    label = f"{product} {version}".strip() or service
                    msg = f"[{state.upper()}] {proto.upper()}/{port} - {label}"

                    yield {
                        "type": "found" if state == "open" else "info",
                        "host": host,
                        "port": port,
                        "protocol": proto,
                        "state": state,
                        "service": service,
                        "version": label,
                        "message": msg,
                    }

        if not nm.all_hosts():
            yield {"type": "warn", "message": "No hosts found. Target may be down or filtered."}

        yield {"type": "done", "message": f"Port scan complete"}

    except nmap.PortScannerError as e:
        if "root" in str(e).lower() or "privilege" in str(e).lower() or "permission" in str(e).lower():
            yield {"type": "error", "message": "SYN/UDP scans require administrator/root privileges. Try TCP scan instead."}
        else:
            yield {"type": "error", "message": f"nmap error: {str(e)}"}
    except Exception as e:
        yield {"type": "error", "message": f"Scan error: {str(e)}"}
