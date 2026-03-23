import re
from typing import AsyncGenerator

HASH_SIGNATURES = [
    # (name, regex, min_len, max_len, notes)
    ("MD5", r"^[a-f0-9]{32}$", 32, 32, "MD5 — 128-bit"),
    ("MD5(Unix)", r"^\$1\$.{1,8}\$.{22}$", 28, 36, "MD5-crypt Unix"),
    ("SHA-1", r"^[a-f0-9]{40}$", 40, 40, "SHA-1 — 160-bit"),
    ("SHA-256", r"^[a-f0-9]{64}$", 64, 64, "SHA-256 — 256-bit"),
    ("SHA-512", r"^[a-f0-9]{128}$", 128, 128, "SHA-512 — 512-bit"),
    ("SHA-384", r"^[a-f0-9]{96}$", 96, 96, "SHA-384 — 384-bit"),
    ("NTLM", r"^[a-f0-9]{32}$", 32, 32, "NTLM (same length as MD5, differentiated by context)"),
    ("LM", r"^[a-f0-9]{32}$", 32, 32, "LAN Manager — legacy Windows"),
    ("bcrypt", r"^\$2[aby]?\$\d{2}\$.{53}$", 60, 60, "bcrypt — adaptive password hashing"),
    ("argon2", r"^\$argon2(i|d|id)\$", 0, 999, "Argon2 — modern password hashing"),
    ("scrypt", r"^\$s0\$", 0, 999, "scrypt — memory-hard KDF"),
    ("SHA-512(Unix)", r"^\$6\$.{1,16}\$.{86}$", 98, 112, "SHA-512-crypt Unix"),
    ("SHA-256(Unix)", r"^\$5\$.{1,16}\$.{43}$", 55, 75, "SHA-256-crypt Unix"),
    ("MySQL4.1+", r"^\*[A-F0-9]{40}$", 41, 41, "MySQL 4.1+ password hash"),
    ("MySQL3.x", r"^[a-f0-9]{16}$", 16, 16, "MySQL 3.x (older)"),
    ("Drupal7", r"^\$S\$.{52}$", 55, 55, "Drupal 7 password hash"),
    ("Django(SHA1)", r"^sha1\$\w{6}\$[a-f0-9]{40}$", 0, 999, "Django SHA1 password"),
    ("Django(bcrypt)", r"^bcrypt\$\$2[aby]?\$.+$", 0, 999, "Django bcrypt password"),
    ("WPA-PSK", r"^[a-f0-9]{64}$", 64, 64, "WPA/WPA2 PSK (PBKDF2-SHA1)"),
    ("MD4", r"^[a-f0-9]{32}$", 32, 32, "MD4 (used in NTLM)"),
    ("CRC32", r"^[a-f0-9]{8}$", 8, 8, "CRC32 checksum"),
    ("Adler32", r"^[a-f0-9]{8}$", 8, 8, "Adler-32 checksum"),
    ("RIPEMD-160", r"^[a-f0-9]{40}$", 40, 40, "RIPEMD-160"),
    ("Whirlpool", r"^[a-f0-9]{128}$", 128, 128, "Whirlpool — 512-bit"),
    ("Base64", r"^[A-Za-z0-9+/]{20,}={0,2}$", 20, 999, "Possible Base64 encoding"),
]


async def identify_hash(hash_str: str) -> AsyncGenerator:
    hash_str = hash_str.strip()
    yield {"type": "info", "message": f"Analyzing hash: {hash_str[:60]}{'...' if len(hash_str) > 60 else ''}"}
    yield {"type": "info", "message": f"Length: {len(hash_str)} characters"}

    # Character set analysis
    charset = set(hash_str)
    if all(c in "0123456789abcdefABCDEF" for c in hash_str):
        yield {"type": "info", "message": "Character set: hexadecimal"}
    elif hash_str.startswith("$"):
        yield {"type": "info", "message": "Character set: modular crypt format (Unix-style)"}

    matches = []
    for name, pattern, min_l, max_l, notes in HASH_SIGNATURES:
        if re.match(pattern, hash_str, re.IGNORECASE):
            matches.append((name, notes))

    if matches:
        yield {"type": "info", "message": f"--- {len(matches)} possible hash type(s) ---"}
        for name, notes in matches:
            yield {
                "type": "found",
                "hash_type": name,
                "notes": notes,
                "message": f"[MATCH] {name} — {notes}",
            }
        yield {"type": "info", "message": "Tip: Use hashcat -m <mode> or john --format=<format> to crack"}
    else:
        yield {"type": "warn", "message": "No matching hash type found. May be salted, encoded, or a custom format."}

    yield {"type": "done", "message": "Hash identification complete"}
