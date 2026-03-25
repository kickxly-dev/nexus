from __future__ import annotations
import httpx
import re


def _identify_hash(hash_str: str) -> tuple[str, str]:
    """
    Identify hash type by length and pattern.
    Returns (type_name, api_type) where api_type is used in md5decrypt API calls.
    """
    h = hash_str.strip()

    # Bcrypt / Argon2 / scrypt by prefix
    if h.startswith("$2a$") or h.startswith("$2b$") or h.startswith("$2y$"):
        return "bcrypt", ""
    if h.startswith("$argon2"):
        return "argon2", ""
    if h.startswith("$6$"):
        return "sha512crypt", ""
    if h.startswith("$5$"):
        return "sha256crypt", ""
    if h.startswith("$1$"):
        return "md5crypt", ""

    # Hex-only hashes by length
    if re.fullmatch(r"[0-9a-fA-F]+", h):
        length = len(h)
        if length == 32:
            return "md5", "md5"
        if length == 40:
            return "sha1", "sha1"
        if length == 56:
            return "sha224", "sha224"
        if length == 64:
            return "sha256", "sha256"
        if length == 96:
            return "sha384", "sha384"
        if length == 128:
            return "sha512", "sha512"

    # MySQL hash patterns
    if re.fullmatch(r"\*[0-9a-fA-F]{40}", h):
        return "mysql5", ""

    return "unknown", ""


async def _try_md5decrypt(client: httpx.AsyncClient, hash_str: str, hash_type: str) -> str | None:
    """Attempt lookup via md5decrypt.net API. Returns plaintext or None."""
    supported = {"md5", "sha1", "sha256", "sha512", "sha224", "sha384"}
    if hash_type not in supported:
        return None
    try:
        url = (
            f"https://md5decrypt.net/Api/api.php"
            f"?hash={hash_str}&hash_type={hash_type}"
            f"&email=nexus@test.com&code=code"
        )
        r = await client.get(url)
        text = r.text.strip()
        # API returns empty string or "ERROR" on failure, plaintext on success
        if text and text.upper() not in ("ERROR", "ERREUR", "NOT FOUND", ""):
            return text
    except Exception:
        pass
    return None


async def _try_hashes_com(client: httpx.AsyncClient, hash_str: str) -> str | None:
    """Attempt lookup via hashes.com decrypt endpoint. Returns plaintext or None."""
    try:
        url = "https://hashes.com/en/decrypt/hash"
        r = await client.post(url, data={"hashes[]": hash_str}, timeout=10)
        if r.status_code == 200:
            # Response is plain text: "HASH:PLAINTEXT" or "Not found"
            text = r.text.strip()
            if ":" in text:
                for line in text.splitlines():
                    if hash_str.lower() in line.lower() and ":" in line:
                        parts = line.split(":", 1)
                        if len(parts) == 2:
                            candidate = parts[1].strip()
                            if candidate and candidate.lower() not in ("not found", ""):
                                return candidate
            # Some responses are JSON-like
            if "plaintext" in text.lower():
                import json as _json
                try:
                    data = _json.loads(text)
                    if isinstance(data, list) and data:
                        return data[0].get("plaintext") or data[0].get("result")
                    if isinstance(data, dict):
                        return data.get("plaintext") or data.get("result")
                except Exception:
                    pass
    except Exception:
        pass
    return None


async def hash_lookup(hash_str: str):
    hash_str = hash_str.strip()

    if not hash_str:
        yield {"type": "error", "message": "No hash provided."}
        return

    yield {"type": "info", "message": f"Analyzing hash: {hash_str}"}

    hash_type, api_type = _identify_hash(hash_str)

    yield {"type": "result", "message": f"Identified hash type: {hash_type.upper()}"}

    if hash_type in ("bcrypt", "argon2", "sha512crypt", "sha256crypt", "md5crypt"):
        yield {
            "type": "warn",
            "message": (
                f"{hash_type} is a slow/salted hash — online lookup databases generally "
                "do not support it. Use a local cracker (hashcat/john) instead."
            ),
        }
        yield {"type": "done", "message": "Hash lookup complete."}
        return

    if hash_type == "unknown":
        yield {
            "type": "warn",
            "message": "Could not identify hash type from length/pattern. Lookup may be inaccurate.",
        }

    yield {"type": "info", "message": "Attempting lookup via md5decrypt.net..."}

    cracked: str | None = None

    async with httpx.AsyncClient(timeout=10, verify=False) as client:
        if api_type:
            cracked = await _try_md5decrypt(client, hash_str, api_type)
            if cracked:
                yield {
                    "type": "found",
                    "message": f"[md5decrypt.net] Cracked: {hash_str} → {cracked!r}",
                }
            else:
                yield {"type": "info", "message": "md5decrypt.net: not found in database."}

        if not cracked:
            yield {"type": "info", "message": "Attempting lookup via hashes.com..."}
            cracked = await _try_hashes_com(client, hash_str)
            if cracked:
                yield {
                    "type": "found",
                    "message": f"[hashes.com] Cracked: {hash_str} → {cracked!r}",
                }
            else:
                yield {"type": "info", "message": "hashes.com: not found in database."}

    if not cracked:
        yield {
            "type": "warn",
            "message": (
                "Hash not found in online databases. "
                "Consider using hashcat or john with a wordlist for offline cracking."
            ),
        }

    yield {"type": "done", "message": "Hash lookup complete."}
