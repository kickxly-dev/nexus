from __future__ import annotations

import asyncio
import re
import socket
from typing import AsyncGenerator, Optional

CONNECT_TIMEOUT = 8
READ_TIMEOUT = 5

WEAK_KEX = [
    "diffie-hellman-group1-sha1",
    "diffie-hellman-group14-sha1",
    "diffie-hellman-group-exchange-sha1",
    "ecdh-sha2-nistp192",
    "ecdh-sha2-nistk163",
]

WEAK_CIPHERS = [
    "arcfour",
    "arcfour128",
    "arcfour256",
    "3des-cbc",
    "blowfish-cbc",
    "cast128-cbc",
    "des",
    "idea-cbc",
    "none",
    "rc4",
]

WEAK_MACS = [
    "hmac-md5",
    "hmac-md5-96",
    "hmac-sha1-96",
    "hmac-sha1-etm@openssh.com",
    "hmac-md5-etm@openssh.com",
    "hmac-md5-96-etm@openssh.com",
    "umac-32@openssh.com",
    "umac-64@openssh.com",
]

WEAK_HOSTKEY = [
    "ssh-dss",
    "ssh-dsa",
    "pgp-sign-dss",
]

# Known vulnerable OpenSSH version ranges (CVE references)
OPENSSH_CVES = [
    (
        (0, 0), (7, 6),
        "Multiple critical CVEs — upgrade to 8.x+",
        ["CVE-2018-10933", "CVE-2016-10009", "CVE-2016-6515"],
    ),
    (
        (7, 7), (8, 2),
        "Possible username enumeration (CVE-2018-15919)",
        ["CVE-2018-15919"],
    ),
    (
        (6, 2), (7, 2),
        "Memory corruption in sftp (CVE-2016-10009)",
        ["CVE-2016-10009"],
    ),
]


def _parse_openssh_version(banner: str) -> Optional[tuple[int, int]]:
    """Parse OpenSSH version from banner like 'OpenSSH_8.9p1'."""
    m = re.search(r"OpenSSH[_\s](\d+)\.(\d+)", banner, re.IGNORECASE)
    if m:
        return int(m.group(1)), int(m.group(2))
    return None


def _sync_get_banner(host: str, port: int) -> tuple[str, str]:
    """Connect to SSH port and read the banner."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(CONNECT_TIMEOUT)
        s.connect((host, port))
        # SSH server sends banner immediately
        banner_bytes = b""
        try:
            s.settimeout(READ_TIMEOUT)
            while b"\n" not in banner_bytes:
                chunk = s.recv(256)
                if not chunk:
                    break
                banner_bytes += chunk
                if len(banner_bytes) > 512:
                    break
        except socket.timeout:
            pass
        s.close()
        banner = banner_bytes.decode("utf-8", errors="replace").strip()
        return banner, ""
    except socket.timeout:
        return "", "Connection timed out"
    except ConnectionRefusedError:
        return "", "Connection refused"
    except Exception as e:
        return "", str(e)


def _sync_get_kex_info(host: str, port: int) -> dict:
    """
    Attempt to read SSH key exchange init packet for algorithm lists.
    After the banner exchange both sides send SSH_MSG_KEXINIT (msg type 20).
    """
    result = {
        "kex": [],
        "host_key": [],
        "ciphers_c2s": [],
        "ciphers_s2c": [],
        "macs_c2s": [],
        "macs_s2c": [],
        "error": "",
    }
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(CONNECT_TIMEOUT)
        s.connect((host, port))

        # Read server banner
        banner_bytes = b""
        s.settimeout(READ_TIMEOUT)
        try:
            while b"\n" not in banner_bytes:
                chunk = s.recv(256)
                if not chunk:
                    break
                banner_bytes += chunk
        except socket.timeout:
            pass

        # Send our banner
        client_banner = b"SSH-2.0-OpenSSH_8.9\r\n"
        s.send(client_banner)

        # Read the KEXINIT packet
        data = b""
        try:
            s.settimeout(READ_TIMEOUT)
            while len(data) < 4096:
                chunk = s.recv(2048)
                if not chunk:
                    break
                data += chunk
                if len(data) > 500:
                    break
        except socket.timeout:
            pass
        s.close()

        if len(data) < 20:
            result["error"] = "Not enough data for KEXINIT parsing"
            return result

        # Find SSH_MSG_KEXINIT (type 20 = 0x14) after 4-byte length + 1-byte pad
        # Packet format: uint32 length, byte padding_length, byte[*] payload
        # We skip the 4-byte packet length and 1-byte padding length
        offset = 0
        while offset < len(data) - 6:
            if offset + 4 > len(data):
                break
            import struct
            pkt_len = struct.unpack(">I", data[offset:offset+4])[0]
            if pkt_len > 65535 or pkt_len < 1:
                offset += 1
                continue
            pad_len = data[offset+4] if offset+4 < len(data) else 0
            msg_type = data[offset+5] if offset+5 < len(data) else 0

            if msg_type == 20:  # SSH_MSG_KEXINIT
                payload_start = offset + 6
                # Skip 16-byte cookie
                pos = payload_start + 16
                if pos >= len(data):
                    break

                def read_list(d: bytes, p: int) -> tuple[list, int]:
                    if p + 4 > len(d):
                        return [], p
                    list_len = struct.unpack(">I", d[p:p+4])[0]
                    p += 4
                    if list_len == 0:
                        return [], p
                    if p + list_len > len(d):
                        return [], p
                    items = d[p:p+list_len].decode("ascii", errors="replace").split(",")
                    return items, p + list_len

                result["kex"], pos = read_list(data, pos)
                result["host_key"], pos = read_list(data, pos)
                result["ciphers_c2s"], pos = read_list(data, pos)
                result["ciphers_s2c"], pos = read_list(data, pos)
                result["macs_c2s"], pos = read_list(data, pos)
                result["macs_s2c"], pos = read_list(data, pos)
                break
            else:
                offset += max(1, pkt_len + 4)

    except Exception as e:
        result["error"] = str(e)

    return result


async def ssh_audit(target: str, port: int = 22) -> AsyncGenerator:
    yield {"type": "info", "message": f"Starting SSH audit on {target}:{port}"}

    loop = asyncio.get_event_loop()

    # Step 1: Get banner
    yield {"type": "progress", "message": "Connecting and reading SSH banner..."}
    try:
        banner, err = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: _sync_get_banner(target, port)),
            timeout=CONNECT_TIMEOUT + 2
        )
    except asyncio.TimeoutError:
        yield {"type": "error", "message": f"Connection to {target}:{port} timed out"}
        yield {"type": "done", "message": "SSH audit complete"}
        return
    except Exception as e:
        yield {"type": "error", "message": f"Connection error: {e}"}
        yield {"type": "done", "message": "SSH audit complete"}
        return

    if err:
        yield {"type": "error", "message": f"Could not connect to {target}:{port} — {err}"}
        yield {"type": "done", "message": "SSH audit complete"}
        return

    if not banner:
        yield {"type": "warn", "message": "No SSH banner received"}
        yield {"type": "done", "message": "SSH audit complete"}
        return

    yield {
        "type": "found",
        "banner": banner,
        "message": f"[Banner] {banner}",
    }

    # Step 2: Parse SSH version
    ssh_version = ""
    server_software = ""
    if banner.startswith("SSH-"):
        parts = banner.split("-", 2)
        if len(parts) >= 2:
            ssh_version = parts[1]
        if len(parts) >= 3:
            server_software = parts[2].strip()

    yield {"type": "data", "message": f"[Protocol] SSH protocol version: {ssh_version}"}
    yield {"type": "data", "message": f"[Software] Server software: {server_software}"}

    if ssh_version.startswith("1"):
        yield {
            "type": "vuln",
            "message": "[CRITICAL] SSHv1 detected — protocol is obsolete and cryptographically broken. Upgrade to SSHv2 immediately.",
        }

    # Step 3: Check for known vulnerable versions
    openssh_ver = _parse_openssh_version(server_software or banner)
    if openssh_ver:
        major, minor = openssh_ver
        yield {"type": "info", "message": f"[Version] OpenSSH {major}.{minor} detected"}

        for (min_ver, max_ver, desc, cves) in OPENSSH_CVES:
            if min_ver <= (major, minor) <= max_ver:
                yield {
                    "type": "vuln",
                    "cves": cves,
                    "version": f"{major}.{minor}",
                    "message": f"[CVE] OpenSSH {major}.{minor} — {desc} ({', '.join(cves)})",
                }

        if (major, minor) >= (8, 0):
            yield {"type": "info", "message": f"[Version] OpenSSH {major}.{minor} — reasonably current, check for latest version"}
    elif "dropbear" in banner.lower():
        m = re.search(r"dropbear[_\s](\d+\.\d+)", banner, re.IGNORECASE)
        if m:
            yield {"type": "data", "message": f"[Version] Dropbear SSH {m.group(1)} detected"}

    # Step 4: Get key exchange algorithms
    yield {"type": "progress", "message": "Reading key exchange algorithms..."}
    try:
        kex_info = await asyncio.wait_for(
            loop.run_in_executor(None, lambda: _sync_get_kex_info(target, port)),
            timeout=15
        )

        if kex_info["error"]:
            yield {"type": "warn", "message": f"Could not parse KEXINIT: {kex_info['error']}"}
        else:
            # Report KEX algorithms
            if kex_info["kex"]:
                yield {"type": "data", "message": f"[KEX] Algorithms: {', '.join(kex_info['kex'])}"}
                for alg in kex_info["kex"]:
                    if alg.lower() in WEAK_KEX:
                        yield {
                            "type": "vuln",
                            "algorithm": alg,
                            "category": "kex",
                            "message": f"[WEAK KEX] {alg} — deprecated/weak key exchange",
                        }

            # Report host key algorithms
            if kex_info["host_key"]:
                yield {"type": "data", "message": f"[Host Keys] {', '.join(kex_info['host_key'])}"}
                for alg in kex_info["host_key"]:
                    if alg.lower() in WEAK_HOSTKEY:
                        yield {
                            "type": "vuln",
                            "algorithm": alg,
                            "category": "host_key",
                            "message": f"[WEAK HOST KEY] {alg} — DSA/DSS host keys are weak",
                        }

            # Report ciphers
            ciphers = list(set(kex_info["ciphers_c2s"] + kex_info["ciphers_s2c"]))
            if ciphers:
                yield {"type": "data", "message": f"[Ciphers] {', '.join(ciphers)}"}
                for cipher in ciphers:
                    if any(w in cipher.lower() for w in WEAK_CIPHERS):
                        yield {
                            "type": "vuln",
                            "algorithm": cipher,
                            "category": "cipher",
                            "message": f"[WEAK CIPHER] {cipher} — weak/deprecated cipher",
                        }

            # Report MACs
            macs = list(set(kex_info["macs_c2s"] + kex_info["macs_s2c"]))
            if macs:
                yield {"type": "data", "message": f"[MACs] {', '.join(macs)}"}
                for mac in macs:
                    if mac.lower() in WEAK_MACS:
                        yield {
                            "type": "warn",
                            "algorithm": mac,
                            "category": "mac",
                            "message": f"[WEAK MAC] {mac} — weak/deprecated MAC algorithm",
                        }

    except asyncio.TimeoutError:
        yield {"type": "warn", "message": "KEXINIT read timed out"}
    except Exception as e:
        yield {"type": "warn", "message": f"Algorithm enumeration error: {e}"}

    yield {"type": "info", "message": "For full SSH audit use: ssh-audit (https://github.com/jtesta/ssh-audit)"}
    yield {"type": "done", "message": "SSH audit complete"}
