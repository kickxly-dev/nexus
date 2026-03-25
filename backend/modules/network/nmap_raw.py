from __future__ import annotations

import asyncio
import shutil
import re
from typing import AsyncGenerator

_OPEN_PORT = re.compile(r"\d+/(tcp|udp)\s+open", re.IGNORECASE)
_OS_DETECT = re.compile(r"OS details:|Running:|OS CPE:", re.IGNORECASE)
_SCRIPT_OUT = re.compile(r"\|\s+", re.IGNORECASE)
_SERVICE_VER = re.compile(r"\d+/(tcp|udp)\s+open\s+\S+\s+.+", re.IGNORECASE)
_PROGRESS = re.compile(
    r"(Stats:|Timing:|Host is up|Starting Nmap|Nmap scan report|NSE:|Service detection|"
    r"Initiating|Completed|Read data files|Warning:)",
    re.IGNORECASE,
)


async def nmap_raw(target: str, flags: str = "-sV -O --script=default") -> AsyncGenerator:
    yield {"type": "info", "message": f"Checking for nmap in PATH..."}

    nmap_path = shutil.which("nmap")
    if not nmap_path:
        yield {
            "type": "error",
            "message": (
                "nmap not found in PATH. Install it:\n"
                "  Windows: https://nmap.org/download.html\n"
                "  Linux:   apt install nmap / yum install nmap\n"
                "  macOS:   brew install nmap"
            ),
        }
        yield {"type": "done", "message": "nmap unavailable"}
        return

    yield {"type": "info", "message": f"Found nmap at {nmap_path}"}

    # Build command — split flags safely, then append target last
    try:
        flag_list = shutil.split(flags) if hasattr(shutil, "split") else flags.split()
    except Exception:
        flag_list = flags.split()

    import shlex as _shlex
    try:
        flag_list = _shlex.split(flags)
    except Exception:
        flag_list = flags.split()

    cmd = [nmap_path] + flag_list + [target]
    yield {"type": "info", "message": f"Running: {' '.join(cmd)}"}

    proc = None
    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )

        try:
            async def read_lines() -> AsyncGenerator:
                while True:
                    line_bytes = await proc.stdout.readline()
                    if not line_bytes:
                        break
                    yield line_bytes.decode(errors="replace").rstrip()

            async for line in read_lines():
                if not line:
                    continue
                if _PROGRESS.search(line) and not _OPEN_PORT.search(line):
                    # Forward timing/progress as progress type but skip pure noise
                    if any(k in line for k in ["Nmap scan report", "Host is up"]):
                        yield {"type": "info", "message": line}
                    continue

                if _SERVICE_VER.search(line):
                    yield {"type": "data", "message": line}
                elif _OPEN_PORT.search(line):
                    yield {"type": "found", "message": line}
                elif _OS_DETECT.search(line):
                    yield {"type": "found", "message": line}
                elif _SCRIPT_OUT.match(line):
                    yield {"type": "result", "message": line}
                else:
                    yield {"type": "info", "message": line}

            await asyncio.wait_for(proc.wait(), timeout=180)

        except asyncio.TimeoutError:
            try:
                proc.kill()
            except Exception:
                pass
            yield {"type": "warn", "message": "nmap timed out after 180 seconds — partial results shown above"}

    except FileNotFoundError:
        yield {"type": "error", "message": f"Could not execute nmap at {nmap_path}"}
    except Exception as e:
        yield {"type": "error", "message": f"Unexpected error running nmap: {e}"}
    finally:
        if proc and proc.returncode is None:
            try:
                proc.kill()
            except Exception:
                pass

    yield {"type": "done", "message": "nmap scan complete"}
