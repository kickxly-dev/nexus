import asyncio
import platform
import re
from typing import AsyncGenerator


async def traceroute(target: str, max_hops: int = 30) -> AsyncGenerator:
    yield {"type": "info", "message": f"Traceroute to {target} (max {max_hops} hops)..."}

    is_windows = platform.system() == "Windows"
    if is_windows:
        cmd = ["tracert", "-d", "-h", str(max_hops), target]
    else:
        cmd = ["traceroute", "-n", "-m", str(max_hops), target]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        hop_count = 0
        while True:
            line = await proc.stdout.readline()
            if not line:
                break
            text = line.decode(errors="replace").rstrip()
            if not text.strip():
                continue

            # Skip header lines
            if any(x in text.lower() for x in ["tracing route", "over a maximum", "trace complete", "traceroute to"]):
                yield {"type": "info", "message": text.strip()}
                continue

            # Parse hop line  e.g.: "  1    <1 ms    <1 ms    <1 ms  192.168.1.1"
            # or: "  1  1.234 ms  1.456 ms  1.789 ms  10.0.0.1"
            # Windows: "  2     1 ms     1 ms     1 ms  172.16.0.1"
            # Timeout: "  3     *        *        *     Request timed out."
            hop_match = re.match(r"^\s*(\d+)\s+(.+)$", text)
            if hop_match:
                hop_num = int(hop_match.group(1))
                rest = hop_match.group(2).strip()
                hop_count = hop_num

                if "*" in rest and ("timed out" in rest.lower() or re.match(r"^[\*\s]+$", rest)):
                    yield {"type": "warn", "message": f"Hop {hop_num:>2}  * * *  (no response)"}
                else:
                    # Extract IP address
                    ip_match = re.search(r"(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})", rest)
                    ip = ip_match.group(1) if ip_match else "unknown"

                    # Extract timing — look for ms values
                    times = re.findall(r"[\d<]+\s*ms", rest)
                    timing = "  ".join(times[:3]) if times else rest

                    msg_type = "found" if ip != "unknown" else "warn"
                    yield {"type": msg_type, "message": f"Hop {hop_num:>2}  {timing:<30}  {ip}"}
            elif text.strip():
                yield {"type": "data", "message": text.strip()}

        await proc.wait()

        if proc.returncode and proc.returncode not in (0, 1):
            stderr = await proc.stderr.read()
            err = stderr.decode(errors="replace").strip()
            if err:
                yield {"type": "error", "message": f"Error: {err}"}

        yield {"type": "done", "message": f"Traceroute complete — {hop_count} hops"}

    except FileNotFoundError:
        cmd_name = "tracert" if is_windows else "traceroute"
        yield {"type": "error", "message": f"{cmd_name} not found. Install traceroute or ensure it's in PATH."}
    except Exception as e:
        yield {"type": "error", "message": f"Traceroute error: {str(e)}"}
