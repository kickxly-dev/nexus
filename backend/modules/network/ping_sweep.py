import asyncio
import socket

async def ping_sweep(network: str):
    yield {"type": "info", "message": f"TCP ping sweep on {network}..."}
    # Parse CIDR
    parts = network.split("/")
    base_ip = parts[0]
    prefix = int(parts[1]) if len(parts) > 1 else 24
    octets = base_ip.split(".")
    base = int(octets[3])
    host_count = min(2 ** (32 - prefix) - 2, 254)
    alive = 0

    async def check_host(ip):
        try:
            loop = asyncio.get_event_loop()
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.5)
            result = await loop.run_in_executor(None, lambda: sock.connect_ex((ip, 80)) == 0 or sock.connect_ex((ip, 443)) == 0 or sock.connect_ex((ip, 22)) == 0)
            sock.close()
            return ip if result else None
        except:
            return None

    prefix_str = ".".join(octets[:3])
    tasks = []
    for i in range(1, min(host_count + 1, 255)):
        ip = f"{prefix_str}.{i}"
        tasks.append(check_host(ip))

    yield {"type": "info", "message": f"Scanning {len(tasks)} hosts..."}

    # Process in batches of 50
    for batch_start in range(0, len(tasks), 50):
        batch = tasks[batch_start:batch_start + 50]
        results = await asyncio.gather(*batch, return_exceptions=True)
        for r in results:
            if r and not isinstance(r, Exception):
                alive += 1
                yield {"type": "found", "message": f"Host alive: {r}"}
        yield {"type": "progress", "message": f"Progress: {min(batch_start + 50, len(tasks))}/{len(tasks)} hosts checked"}

    yield {"type": "result", "message": f"Sweep complete: {alive} hosts alive out of {len(tasks)} scanned"}
