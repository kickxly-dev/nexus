import asyncio
from typing import AsyncGenerator


async def arp_scan(network: str) -> AsyncGenerator:
    yield {"type": "info", "message": f"Starting ARP scan on {network}..."}
    yield {"type": "warn", "message": "ARP scan requires administrator/root privileges"}

    try:
        from scapy.layers.l2 import ARP, Ether
        from scapy.sendrecv import srp
        import scapy.all as scapy

        def do_scan():
            arp = ARP(pdst=network)
            ether = Ether(dst="ff:ff:ff:ff:ff:ff")
            packet = ether / arp
            result = srp(packet, timeout=3, verbose=False)[0]
            return result

        result = await asyncio.to_thread(do_scan)

        if not result:
            yield {"type": "warn", "message": "No hosts responded. Check network range or run as administrator."}
        else:
            for _, received in result:
                yield {
                    "type": "found",
                    "ip": received.psrc,
                    "mac": received.hwsrc,
                    "message": f"[HOST] {received.psrc} — MAC: {received.hwsrc}",
                }

        yield {"type": "done", "message": f"ARP scan complete. Found {len(result)} hosts."}

    except PermissionError:
        yield {"type": "error", "message": "Permission denied. Run Nexus as Administrator (Windows) or root (Linux/macOS)."}
    except ImportError:
        yield {"type": "error", "message": "Scapy not installed. Run: pip install scapy"}
    except Exception as e:
        yield {"type": "error", "message": f"ARP scan error: {str(e)}"}
