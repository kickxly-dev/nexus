import asyncio
import hashlib
import time
from pathlib import Path
from typing import AsyncGenerator
from config import DEFAULT_CRACK_WORDLIST

SUPPORTED_ALGORITHMS = {
    "md5": hashlib.md5,
    "sha1": hashlib.sha1,
    "sha256": hashlib.sha256,
    "sha512": hashlib.sha512,
    "sha384": hashlib.sha384,
}


def apply_mutations(word: str):
    yield word
    yield word.lower()
    yield word.upper()
    yield word.capitalize()
    yield word + "1"
    yield word + "123"
    yield word + "!"
    yield word[::-1]  # reverse


async def crack_hash(
    hash_value: str,
    hash_type: str,
    wordlist_path: str = None,
    use_mutations: bool = True,
) -> AsyncGenerator:
    hash_type = hash_type.lower()
    if hash_type not in SUPPORTED_ALGORITHMS:
        yield {"type": "error", "message": f"Unsupported algorithm: {hash_type}. Supported: {', '.join(SUPPORTED_ALGORITHMS)}"}
        return

    wl = Path(wordlist_path) if wordlist_path else DEFAULT_CRACK_WORDLIST
    if not wl.exists():
        yield {"type": "error", "message": f"Wordlist not found: {wl}"}
        return

    hash_func = SUPPORTED_ALGORITHMS[hash_type]
    target = hash_value.strip().lower()

    yield {"type": "info", "message": f"Cracking {hash_type.upper()} hash: {target[:32]}..."}
    yield {"type": "info", "message": f"Wordlist: {wl.name}"}

    tried = 0
    start = time.time()
    chunk_size = 1000
    batch = []

    def try_batch(words):
        for word in words:
            candidates = list(apply_mutations(word)) if use_mutations else [word]
            for candidate in candidates:
                h = hash_func(candidate.encode()).hexdigest()
                if h == target:
                    return candidate
        return None

    with open(wl, "r", errors="replace") as f:
        for line in f:
            word = line.strip()
            if not word:
                continue
            batch.append(word)
            tried += 1

            if len(batch) >= chunk_size:
                result = await asyncio.to_thread(try_batch, batch)
                batch = []
                elapsed = time.time() - start
                rate = int(tried / elapsed) if elapsed > 0 else 0

                if result:
                    yield {
                        "type": "found",
                        "plaintext": result,
                        "tried": tried,
                        "rate": rate,
                        "message": f"[CRACKED] {hash_type.upper()}:{target[:16]}... = '{result}' (tried {tried} @ {rate}/s)",
                    }
                    yield {"type": "done", "message": f"Hash cracked in {elapsed:.1f}s"}
                    return

                if tried % 5000 == 0:
                    yield {
                        "type": "progress",
                        "tried": tried,
                        "rate": rate,
                        "message": f"Tried {tried} words @ {rate}/s...",
                    }

        # Final batch
        if batch:
            result = await asyncio.to_thread(try_batch, batch)
            if result:
                elapsed = time.time() - start
                yield {
                    "type": "found",
                    "plaintext": result,
                    "tried": tried,
                    "message": f"[CRACKED] '{result}'",
                }
                yield {"type": "done", "message": "Hash cracked!"}
                return

    elapsed = time.time() - start
    yield {"type": "warn", "message": f"Hash not found in wordlist. Tried {tried} words in {elapsed:.1f}s."}
    yield {"type": "done", "message": "Cracking complete — no match found"}
