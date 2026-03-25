from __future__ import annotations

import asyncio
import socket
import struct
from typing import AsyncGenerator

SMB_PORTS = [445, 139]
CONNECT_TIMEOUT = 5

# SMBv1 negotiate protocol request (raw bytes)
# This is a minimal NetBIOS-wrapped SMB negotiate packet
SMB1_NEGOTIATE = (
    b"\x00\x00\x00\x54"           # NetBIOS session message, length 0x54
    b"\xff\x53\x4d\x42"           # SMB magic
    b"\x72"                        # SMB command: Negotiate Protocol
    b"\x00\x00\x00\x00"           # NT Status
    b"\x18\x01\xc8\x00"           # Flags
    b"\x00\x00"                   # PID high
    b"\x00\x00\x00\x00\x00\x00\x00\x00"  # Signature
    b"\x00\x00"                   # Reserved
    b"\xff\xff"                   # Tree ID
    b"\xff\xfe"                   # Process ID
    b"\xff\xff"                   # User ID
    b"\xff\xff"                   # Multiplex ID
    # Parameters
    b"\x00"                       # Word count
    # Data
    b"\x26\x00"                   # Byte count (38)
    b"\x02\x4e\x54\x20\x4c\x4d\x20\x30\x2e\x31\x32\x00"  # NT LM 0.12
    b"\x02\x53\x4d\x42\x20\x32\x2e\x30\x30\x32\x00"       # SMB 2.002
    b"\x02\x53\x4d\x42\x20\x32\x2e\x3f\x3f\x3f\x00"       # SMB 2.???
)


async def _check_port(host: str, port: int) -> bool:
    try:
        loop = asyncio.get_event_loop()
        conn = loop.run_in_executor(None, lambda: _sync_connect(host, port))
        result = await asyncio.wait_for(conn, timeout=CONNECT_TIMEOUT)
        return result
    except (asyncio.TimeoutError, Exception):
        return False


def _sync_connect(host: str, port: int) -> bool:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(CONNECT_TIMEOUT)
        s.connect((host, port))
        s.close()
        return True
    except Exception:
        return False


def _sync_smb_probe(host: str, port: int) -> dict:
    """Probe SMB and return version/capabilities info."""
    result = {
        "connected": False,
        "banner": "",
        "smb1": False,
        "smb2": False,
        "dialect": "",
        "error": "",
    }
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(CONNECT_TIMEOUT)
        s.connect((host, port))

        # Send SMB1 negotiate
        s.send(SMB1_NEGOTIATE)
        data = s.recv(4096)
        s.close()

        result["connected"] = True

        if not data:
            result["error"] = "Empty response"
            return result

        # Parse NetBIOS header
        if len(data) < 8:
            result["banner"] = data.hex()
            return result

        # Check for SMB2 response
        if b"\xfeSMB" in data:
            result["smb2"] = True
            result["dialect"] = "SMB2+"
            # Try to extract dialect revision
            idx = data.find(b"\xfeSMB")
            if idx >= 0 and len(data) >= idx + 72:
                try:
                    dialect_rev = struct.unpack_from("<H", data, idx + 68)[0]
                    dialects = {
                        0x0202: "SMB 2.0.2",
                        0x0210: "SMB 2.1",
                        0x0300: "SMB 3.0",
                        0x0302: "SMB 3.0.2",
                        0x0311: "SMB 3.1.1",
                        0x02ff: "SMB 2.???",
                    }
                    result["dialect"] = dialects.get(dialect_rev, f"SMB2 dialect 0x{dialect_rev:04x}")
                except Exception:
                    pass

        # Check for SMB1 response
        elif b"\xffSMB" in data:
            result["smb1"] = True
            result["dialect"] = "SMB1 (CIFS)"

        result["banner"] = data[:32].hex()
        return result

    except socket.timeout:
        result["error"] = "Connection timed out"
        return result
    except Exception as e:
        result["error"] = str(e)
        return result


async def smb_enum(target: str) -> AsyncGenerator:
    yield {"type": "info", "message": f"Starting SMB enumeration on {target}"}

    open_port = None

    # Step 1: Check which SMB ports are open
    yield {"type": "progress", "message": "Scanning SMB ports (445, 139)..."}
    for port in SMB_PORTS:
        is_open = await _check_port(target, port)
        if is_open:
            yield {
                "type": "found",
                "port": port,
                "message": f"[Open] Port {port}/TCP is open (SMB)",
            }
            if open_port is None:
                open_port = port
        else:
            yield {
                "type": "info",
                "port": port,
                "message": f"[Closed] Port {port}/TCP is closed",
            }

    if open_port is None:
        yield {"type": "warn", "message": "No SMB ports open. Target may not have SMB enabled."}
        yield {"type": "done", "message": "SMB enumeration complete"}
        return

    # Step 2: Probe SMB version
    yield {"type": "progress", "message": f"Probing SMB version on port {open_port}..."}
    loop = asyncio.get_event_loop()
    try:
        probe_result = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: _sync_smb_probe(target, open_port)),
            timeout=10
        )

        if probe_result["error"] and not probe_result["connected"]:
            yield {"type": "warn", "message": f"SMB probe error: {probe_result['error']}"}
        else:
            if probe_result["smb1"]:
                yield {
                    "type": "vuln",
                    "dialect": "SMBv1",
                    "message": "[CRITICAL] SMBv1 (CIFS) is enabled — vulnerable to EternalBlue (MS17-010), WannaCry, NotPetya. Disable immediately.",
                }
            elif probe_result["smb2"]:
                yield {
                    "type": "found",
                    "dialect": probe_result["dialect"],
                    "message": f"[Found] SMB dialect: {probe_result['dialect']}",
                }

            if probe_result["dialect"]:
                yield {
                    "type": "data",
                    "message": f"[Version] Detected: {probe_result['dialect']}",
                }

    except asyncio.TimeoutError:
        yield {"type": "warn", "message": "SMB version probe timed out"}
    except Exception as e:
        yield {"type": "warn", "message": f"SMB probe error: {e}"}

    # Step 3: Check for MS17-010 (EternalBlue) indicators
    yield {"type": "progress", "message": "Checking MS17-010 / EternalBlue indicators..."}
    try:
        # MS17-010 uses SMBv1 with specific transaction requests
        # We check if SMBv1 is present as the primary indicator
        if probe_result.get("smb1"):
            yield {
                "type": "vuln",
                "cve": "MS17-010",
                "message": "[VULN] MS17-010 (EternalBlue) — SMBv1 detected on target. High likelihood of vulnerability if unpatched.",
            }
        else:
            yield {"type": "info", "message": "[MS17-010] SMBv1 not confirmed — reduced EternalBlue risk"}
    except Exception as e:
        yield {"type": "warn", "message": f"MS17-010 check error: {e}"}

    # Step 4: Try to get NetBIOS name / null session info via port 139
    yield {"type": "progress", "message": "Checking NetBIOS name service..."}
    try:
        # NetBIOS name query
        NBNS_QUERY = (
            b"\x82\x28\x00\x00\x00\x01\x00\x00"
            b"\x00\x00\x00\x00\x20\x43\x4b\x41"
            b"\x41\x41\x41\x41\x41\x41\x41\x41"
            b"\x41\x41\x41\x41\x41\x41\x41\x41"
            b"\x41\x41\x41\x41\x41\x41\x41\x41"
            b"\x41\x41\x41\x41\x41\x00\x00\x21"
            b"\x00\x01"
        )
        loop = asyncio.get_event_loop()

        def _nbns_query():
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.settimeout(3)
                s.sendto(NBNS_QUERY, (target, 137))
                data, _ = s.recvfrom(1024)
                s.close()
                return data
            except Exception:
                return None

        nbns_data = await asyncio.wait_for(
            loop.run_in_executor(None, _nbns_query),
            timeout=5
        )
        if nbns_data and len(nbns_data) > 56:
            # Try to extract NetBIOS names from response
            yield {"type": "found", "message": f"[NetBIOS] Response received ({len(nbns_data)} bytes) — host has NetBIOS name service"}
        else:
            yield {"type": "info", "message": "[NetBIOS] No NetBIOS name service response (UDP 137)"}

    except Exception as e:
        yield {"type": "info", "message": f"[NetBIOS] Could not query: {e}"}

    # Step 5: Security recommendations
    yield {"type": "info", "message": "--- Recommendations ---"}
    yield {"type": "info", "message": "• Disable SMBv1 if enabled: Set-SmbServerConfiguration -EnableSMB1Protocol $false"}
    yield {"type": "info", "message": "• Ensure SMB signing is required to prevent relay attacks"}
    yield {"type": "info", "message": "• Block ports 445/139 from internet-facing interfaces"}
    yield {"type": "info", "message": "• Use Metasploit (ms17_010_eternalblue) or nmap --script smb-vuln-ms17-010 for definitive MS17-010 check"}

    yield {"type": "done", "message": "SMB enumeration complete"}
