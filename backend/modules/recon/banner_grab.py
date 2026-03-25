from __future__ import annotations
import asyncio
import re


def _parse_ports(ports_str: str) -> list[int]:
    """Parse a comma/dash port string into a sorted list of unique port numbers."""
    ports: set[int] = set()
    for part in ports_str.split(","):
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            start_s, end_s = part.split("-", 1)
            try:
                start, end = int(start_s.strip()), int(end_s.strip())
                for p in range(start, end + 1):
                    if 1 <= p <= 65535:
                        ports.add(p)
            except ValueError:
                pass
        else:
            try:
                p = int(part)
                if 1 <= p <= 65535:
                    ports.add(p)
            except ValueError:
                pass
    return sorted(ports)


def _clean_banner(raw: bytes) -> str:
    """Decode bytes, strip null bytes and most control characters."""
    text = raw.decode("utf-8", errors="replace")
    # Remove null bytes
    text = text.replace("\x00", "")
    # Replace control chars (except tab, newline, carriage return) with a space
    text = re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", text)
    # Collapse excessive whitespace but preserve newlines for multi-line banners
    lines = [line.rstrip() for line in text.splitlines()]
    text = " | ".join(line for line in lines if line.strip())
    return text.strip()


async def _grab_banner(host: str, port: int, timeout: float = 3.0) -> str | None:
    """Attempt to connect and grab a banner. Returns banner string or None."""
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(host, port), timeout=timeout
        )
    except (asyncio.TimeoutError, ConnectionRefusedError, OSError):
        return None

    banner_bytes = b""
    try:
        # Some services send a banner immediately (SSH, FTP, SMTP, etc.)
        try:
            banner_bytes = await asyncio.wait_for(reader.read(512), timeout=timeout)
        except asyncio.TimeoutError:
            pass

        # If nothing received, send a generic probe
        if not banner_bytes:
            try:
                writer.write(b"\r\n")
                await asyncio.wait_for(writer.drain(), timeout=1.0)
                banner_bytes = await asyncio.wait_for(reader.read(512), timeout=timeout)
            except (asyncio.TimeoutError, ConnectionResetError, OSError):
                pass
    finally:
        try:
            writer.close()
            await asyncio.wait_for(writer.wait_closed(), timeout=1.0)
        except Exception:
            pass

    if banner_bytes:
        return _clean_banner(banner_bytes)
    return None


async def banner_grab(host: str, ports: str = "21,22,23,25,80,110,143,443,3306,3389,8080"):
    yield {"type": "info", "message": f"Starting banner grab on {host}..."}

    port_list = _parse_ports(ports)
    if not port_list:
        yield {"type": "error", "message": "No valid ports specified."}
        return

    if len(port_list) > 50:
        port_list = port_list[:50]
        yield {
            "type": "warn",
            "message": f"Too many ports specified. Capped at 50. Scanning: {port_list[0]}-{port_list[-1]}",
        }

    yield {"type": "info", "message": f"Scanning {len(port_list)} port(s) on {host}..."}

    found_count = 0
    open_count = 0

    for port in port_list:
        yield {"type": "progress", "message": f"Probing {host}:{port}..."}
        banner = await _grab_banner(host, port)

        if banner is None:
            yield {"type": "info", "message": f"[CLOSED/FILTERED] {host}:{port}"}
        elif banner == "":
            open_count += 1
            yield {"type": "data", "message": f"[OPEN] {host}:{port}  — (no banner)"}
        else:
            open_count += 1
            found_count += 1
            # Truncate very long banners for display
            display = banner if len(banner) <= 200 else banner[:200] + "..."
            yield {"type": "found", "message": f"[OPEN] {host}:{port}  — {display}"}

    yield {
        "type": "done",
        "message": (
            f"Banner grab complete. {open_count} port(s) open, "
            f"{found_count} banner(s) retrieved out of {len(port_list)} scanned."
        ),
    }
