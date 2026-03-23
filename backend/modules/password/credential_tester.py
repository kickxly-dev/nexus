import asyncio
import httpx
import time
from typing import AsyncGenerator, List
from config import CREDENTIAL_DELAY


async def test_credentials(
    url: str,
    usernames: List[str],
    passwords: List[str],
    auth_type: str = "basic",
    success_pattern: str = None,
    success_status: int = 200,
    delay: float = CREDENTIAL_DELAY,
    form_user_field: str = "username",
    form_pass_field: str = "password",
) -> AsyncGenerator:
    total = len(usernames) * len(passwords)
    yield {"type": "info", "message": f"Credential testing on {url}"}
    yield {"type": "info", "message": f"Auth type: {auth_type} | {len(usernames)} users × {len(passwords)} passwords = {total} attempts"}
    yield {"type": "warn", "message": "Only use on systems you own or have explicit written authorization to test"}

    if total > 1000:
        yield {"type": "warn", "message": f"Large attempt count ({total}). This may trigger lockouts or IDS alerts."}

    tried = 0
    found = []

    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        for username in usernames:
            for password in passwords:
                tried += 1
                try:
                    if auth_type == "basic":
                        r = await client.get(url, auth=(username, password))
                    elif auth_type == "form":
                        r = await client.post(url, data={
                            form_user_field: username,
                            form_pass_field: password,
                        })
                    elif auth_type == "digest":
                        from httpx import DigestAuth
                        r = await client.get(url, auth=DigestAuth(username, password))
                    else:
                        r = await client.post(url, json={"username": username, "password": password})

                    success = False
                    if success_pattern and success_pattern in r.text:
                        success = True
                    elif not success_pattern and r.status_code == success_status:
                        success = True

                    if success:
                        found.append({"username": username, "password": password})
                        yield {
                            "type": "found",
                            "username": username,
                            "password": password,
                            "status": r.status_code,
                            "message": f"[SUCCESS] {username}:{password} → HTTP {r.status_code}",
                        }
                    else:
                        if tried % 10 == 0:
                            yield {
                                "type": "progress",
                                "tried": tried,
                                "total": total,
                                "message": f"Tried {tried}/{total} | Last: {username}:{password} → {r.status_code}",
                            }

                except Exception as e:
                    yield {"type": "warn", "message": f"Error testing {username}:{password} — {e}"}

                await asyncio.sleep(delay)

    if found:
        yield {"type": "info", "message": f"--- {len(found)} valid credential(s) found ---"}
        for cred in found:
            yield {"type": "found", "message": f"  {cred['username']}:{cred['password']}"}
    else:
        yield {"type": "info", "message": "No valid credentials found"}

    yield {"type": "done", "message": f"Credential testing complete. {tried} attempts, {len(found)} hits."}
