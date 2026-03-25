from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import json
import re
from typing import AsyncGenerator, Optional

# 200+ common JWT secrets
COMMON_SECRETS = [
    "secret", "password", "123456", "admin", "jwt_secret", "your-256-bit-secret",
    "key", "mysecret", "test", "change_this", "supersecret", "changeme",
    "letmein", "welcome", "monkey", "dragon", "master", "1234567890",
    "qwerty", "abc123", "password123", "admin123", "root", "toor",
    "pass", "pass123", "passwd", "P@ssw0rd", "P@ssword", "Password1",
    "Password123", "passw0rd", "pa$$word", "secret123", "secretkey",
    "my_secret", "my-secret", "mysecretkey", "my-secret-key",
    "jwt-secret", "jwtsecret", "jwtkey", "jwt_key", "jwt-key",
    "token_secret", "tokensecret", "access_token", "api_secret",
    "app_secret", "application_secret", "auth_secret", "auth_key",
    "authentication_secret", "signing_key", "signing_secret",
    "private_key", "privatekey", "private-key", "public_key",
    "app_key", "app-key", "appkey", "appSecret", "APP_SECRET",
    "SECRET_KEY", "SECRET", "KEY", "PASSPHRASE", "passphrase",
    "HS256", "HS384", "HS512", "RS256", "RS384", "RS512",
    "none", "null", "undefined", "false", "true",
    "test123", "test1234", "test12345", "testing", "testing123",
    "dev", "development", "dev_secret", "devkey", "dev-key",
    "prod", "production", "prod_secret", "prodkey", "staging",
    "api", "api_key", "apikey", "api-key", "API_KEY",
    "token", "TOKEN", "accesstoken", "access-token", "access_token",
    "refresh_token", "refreshtoken", "oauth_secret", "oauth_key",
    "client_secret", "client_id", "client-secret",
    "flask", "django", "express", "fastapi", "spring",
    "rails_secret", "laravel_app_key", "symfony_secret",
    "123", "1234", "12345", "123456", "1234567", "12345678",
    "123456789", "1234567890", "000000", "111111", "222222",
    "333333", "444444", "555555", "666666", "777777", "888888",
    "999999", "qwerty", "qwerty123", "qwertyuiop", "asdfgh",
    "asdfghjkl", "zxcvbnm", "iloveyou", "sunshine", "princess",
    "football", "baseball", "soccer", "batman", "superman",
    "michael", "jessica", "shadow", "hunter", "ranger",
    "harley", "pokemon", "starwars", "matrix", "hello",
    "hello123", "helloworld", "world", "world123",
    "!@#$%^&*", "!@#$%", "P@$$w0rd", "Passw0rd!",
    "spring.security.secret", "your_jwt_secret_key",
    "your-secret-key", "my_jwt_secret", "jwtSecretKey",
    "jwt_signing_key", "JWT_SIGNING_KEY", "JWT_SECRET_KEY",
    "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "0000000000000000000000000000000000",
    "super-secret-jwt-token-with-at-least-256-bits",
    "this-is-my-secret", "thisisthesecret", "the_secret",
    "my_signing_key", "signing_key_secret", "shared_secret",
    "SHARED_SECRET", "hmac_secret", "HMAC_SECRET",
    "salt", "pepper", "seed", "nonce", "entropy",
    "changeme123", "changeme!", "change_me", "change-me",
    "update_this", "update-this", "replace-me", "todo",
    "fixme", "placeholder", "example_secret", "sample_secret",
    "default", "default_secret", "default-secret", "defaultkey",
    "local_secret", "local-secret", "dev_secret_key",
    "production_secret_key", "prod_jwt_secret",
    "abcdef", "abcdefgh", "abcdefghij", "abcdefghijklmn",
    "abcdefghijklmnop", "abcdefghijklmnopqrstuvwxyz",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "AaBbCcDdEe",
    "keyboard", "keyboard_cat", "keyboardcat",
    "hunter2", "correcthorsebatterystaple",
    "Tr0ub4dor&3", "correct horse battery staple",
    "thisismysecretpassword", "thisisnotasecret",
    "reallysecretpassword", "verysecretpassword",
    "opensecret", "openpassword", "openkey",
]


def _b64url_decode(data: str) -> bytes:
    """Decode base64url without padding."""
    padding = 4 - len(data) % 4
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data)


def _parse_jwt(token: str) -> tuple[dict, dict, str] | tuple[None, None, None]:
    """Parse JWT into header, payload, signature."""
    parts = token.strip().split(".")
    if len(parts) != 3:
        return None, None, None
    try:
        header = json.loads(_b64url_decode(parts[0]))
        payload = json.loads(_b64url_decode(parts[1]))
        return header, payload, token
    except Exception:
        return None, None, None


def _verify_jwt(token: str, secret: str, algorithm: str) -> bool:
    """Verify JWT signature with given secret."""
    parts = token.strip().split(".")
    if len(parts) != 3:
        return False

    signing_input = f"{parts[0]}.{parts[1]}".encode("utf-8")
    try:
        sig_bytes = _b64url_decode(parts[2])
    except Exception:
        return False

    algo_map = {
        "HS256": hashlib.sha256,
        "HS384": hashlib.sha384,
        "HS512": hashlib.sha512,
    }

    hash_func = algo_map.get(algorithm.upper())
    if not hash_func:
        return False

    expected = hmac.new(secret.encode("utf-8"), signing_input, hash_func).digest()
    return hmac.compare_digest(expected, sig_bytes)


async def jwt_crack(token: str, wordlist_path: Optional[str] = None) -> AsyncGenerator:
    yield {"type": "info", "message": "Starting JWT secret cracking..."}

    # Parse JWT
    header, payload, _ = _parse_jwt(token)
    if header is None:
        yield {"type": "error", "message": "Invalid JWT format — expected three base64url-encoded parts separated by dots"}
        yield {"type": "done", "message": "JWT cracking complete"}
        return

    yield {"type": "data", "message": f"[Header] {json.dumps(header)}"}
    yield {"type": "data", "message": f"[Payload] {json.dumps(payload)}"}

    algorithm = header.get("alg", "unknown")
    yield {"type": "info", "message": f"[Algorithm] {algorithm}"}

    # Check for critical 'none' algorithm
    if algorithm.lower() == "none":
        yield {
            "type": "vuln",
            "message": "[CRITICAL] Algorithm is 'none' — JWT signature is not verified. Attacker can forge any payload.",
        }
        yield {"type": "done", "message": "JWT cracking complete"}
        return

    if algorithm not in ("HS256", "HS384", "HS512"):
        yield {
            "type": "warn",
            "message": f"[Algorithm] {algorithm} is not HMAC-based — secret cracking not applicable (requires private key for RS/ES/PS algorithms)",
        }
        if algorithm.lower().startswith("rs") or algorithm.lower().startswith("ps"):
            yield {"type": "info", "message": "For RSA algorithms, extract public key and check for weak key size or key confusion attacks"}
        yield {"type": "done", "message": "JWT cracking complete"}
        return

    # Build wordlist
    secrets = list(COMMON_SECRETS)
    if wordlist_path:
        try:
            with open(wordlist_path, "r", errors="replace") as f:
                extra = [line.strip() for line in f if line.strip()]
                added = [s for s in extra if s not in secrets]
                secrets.extend(added)
                yield {"type": "info", "message": f"Loaded {len(added)} additional secrets from wordlist"}
        except Exception as e:
            yield {"type": "warn", "message": f"Could not load wordlist: {e}"}

    yield {"type": "info", "message": f"Trying {len(secrets)} candidate secrets..."}

    # Crack in batches using asyncio
    found_secret = None
    batch_size = 50
    checked = 0

    for i in range(0, len(secrets), batch_size):
        batch = secrets[i:i + batch_size]

        def check_batch(candidates: list[str]) -> Optional[str]:
            for candidate in candidates:
                if _verify_jwt(token, candidate, algorithm):
                    return candidate
            return None

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, check_batch, batch)
        checked += len(batch)

        if result is not None:
            found_secret = result
            break

        if i % 500 == 0 and i > 0:
            yield {"type": "progress", "message": f"Checked {checked}/{len(secrets)} candidates..."}

        await asyncio.sleep(0)  # yield control

    if found_secret is not None:
        yield {
            "type": "vuln",
            "secret": found_secret,
            "algorithm": algorithm,
            "message": f"[CRACKED] JWT secret found: '{found_secret}' (algorithm: {algorithm})",
        }

        # Decode and display payload claims
        if payload:
            yield {"type": "info", "message": "--- Decoded Claims ---"}
            for k, v in payload.items():
                yield {"type": "data", "message": f"  {k}: {v}"}
    else:
        yield {
            "type": "info",
            "message": f"Secret not found in {len(secrets)}-entry wordlist. Try a larger wordlist.",
        }

    yield {"type": "done", "message": f"JWT cracking complete. Checked {checked} candidates."}
