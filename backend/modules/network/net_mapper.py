import asyncio
import nmap
from typing import AsyncGenerator


async def map_network(target: str, deep: bool = False) -> AsyncGenerator:
    yield {"type": "info", "message": f"Mapping network: {target} ({'deep scan' if deep else 'ping sweep'})"}

    try:
        nm = nmap.PortScanner()

        if deep:
            args = "-sV -O --open"
            yield {"type": "warn", "message": "Deep scan with OS detection may require admin privileges"}
        else:
            args = "-sn"

        result = await asyncio.to_thread(nm.scan, hosts=target, arguments=args)

        hosts_found = 0
        for host in nm.all_hosts():
            hosts_found += 1
            state = nm[host].state()
            hostname = nm[host].hostname() or ""

            host_info = {
                "type": "found",
                "host": host,
                "hostname": hostname,
                "state": state,
                "message": f"[{state.upper()}] {host}" + (f" ({hostname})" if hostname else ""),
            }

            if deep and state == "up":
                # OS detection
                if "osmatch" in nm[host] and nm[host]["osmatch"]:
                    best_os = nm[host]["osmatch"][0]
                    host_info["os"] = best_os["name"]
                    host_info["os_accuracy"] = best_os["accuracy"]
                    yield {**host_info, "message": host_info["message"] + f" — OS: {best_os['name']} ({best_os['accuracy']}%)"}
                else:
                    yield host_info

                # Services
                for proto in nm[host].all_protocols():
                    for port, data in nm[host][proto].items():
                        yield {
                            "type": "found",
                            "host": host,
                            "port": port,
                            "service": data.get("name", "unknown"),
                            "version": f"{data.get('product', '')} {data.get('version', '')}".strip(),
                            "message": f"  └─ {proto}/{port}: {data.get('name')} {data.get('product', '')} {data.get('version', '')}".strip(),
                        }
            else:
                yield host_info

        if hosts_found == 0:
            yield {"type": "warn", "message": "No hosts discovered. Check target range."}

        yield {"type": "done", "message": f"Network map complete. {hosts_found} hosts found."}

    except nmap.PortScannerError as e:
        yield {"type": "error", "message": f"nmap error: {str(e)}. Make sure nmap is installed."}
    except Exception as e:
        yield {"type": "error", "message": f"Mapping error: {str(e)}"}
