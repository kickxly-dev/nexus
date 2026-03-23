import base64
import hashlib
import urllib.parse
import binascii

async def encoder(text: str, operations: list = None):
    if not operations:
        operations = ["base64_encode", "url_encode", "hex_encode", "md5", "sha1", "sha256", "rot13", "binary"]

    yield {"type": "info", "message": f"Encoding/hashing: '{text[:50]}{'...' if len(text)>50 else ''}'"}

    for op in operations:
        try:
            if op == "base64_encode":
                result = base64.b64encode(text.encode()).decode()
                yield {"type": "found", "message": f"Base64: {result}"}
            elif op == "base64_decode":
                result = base64.b64decode(text.encode()).decode()
                yield {"type": "found", "message": f"Base64 decoded: {result}"}
            elif op == "url_encode":
                result = urllib.parse.quote(text)
                yield {"type": "found", "message": f"URL encoded: {result}"}
            elif op == "url_decode":
                result = urllib.parse.unquote(text)
                yield {"type": "found", "message": f"URL decoded: {result}"}
            elif op == "hex_encode":
                result = binascii.hexlify(text.encode()).decode()
                yield {"type": "found", "message": f"Hex: {result}"}
            elif op == "hex_decode":
                result = binascii.unhexlify(text.encode()).decode()
                yield {"type": "found", "message": f"Hex decoded: {result}"}
            elif op == "md5":
                result = hashlib.md5(text.encode()).hexdigest()
                yield {"type": "found", "message": f"MD5: {result}"}
            elif op == "sha1":
                result = hashlib.sha1(text.encode()).hexdigest()
                yield {"type": "found", "message": f"SHA1: {result}"}
            elif op == "sha256":
                result = hashlib.sha256(text.encode()).hexdigest()
                yield {"type": "found", "message": f"SHA256: {result}"}
            elif op == "sha512":
                result = hashlib.sha512(text.encode()).hexdigest()
                yield {"type": "found", "message": f"SHA512: {result}"}
            elif op == "rot13":
                result = text.translate(str.maketrans('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 'NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm'))
                yield {"type": "found", "message": f"ROT13: {result}"}
            elif op == "binary":
                result = ' '.join(format(ord(c), '08b') for c in text)
                yield {"type": "found", "message": f"Binary: {result}"}
        except Exception as e:
            yield {"type": "error", "message": f"{op}: {e}"}
