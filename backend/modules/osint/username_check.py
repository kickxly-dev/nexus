import httpx
import asyncio

PLATFORMS = [
    ("GitHub",      "https://github.com/{}",                           200, None),
    ("GitLab",      "https://gitlab.com/{}",                           200, None),
    ("Reddit",      "https://www.reddit.com/user/{}/about.json",       200, None),
    ("HackerNews",  "https://hacker-news.firebaseio.com/v0/user/{}.json", 200, "null"),
    ("Keybase",     "https://keybase.io/{}",                           200, None),
    ("Dev.to",      "https://dev.to/{}",                               200, None),
    ("Replit",      "https://replit.com/@{}",                          200, None),
    ("PyPI",        "https://pypi.org/user/{}/",                       200, None),
    ("npm",         "https://www.npmjs.com/~{}",                       200, None),
    ("Pastebin",    "https://pastebin.com/u/{}",                       200, None),
    ("Steam",       "https://steamcommunity.com/id/{}",                200, "error"),
    ("Twitch",      "https://www.twitch.tv/{}",                        200, None),
]

async def username_check(username: str):
    yield {"type": "info", "message": f"Scanning username '{username}' across {len(PLATFORMS)} platforms..."}

    found = 0
    sem = asyncio.Semaphore(6)

    async def check(name, url, ok_status, not_found_body):
        async with sem:
            try:
                async with httpx.AsyncClient(timeout=8, follow_redirects=True,
                    headers={"User-Agent": "Mozilla/5.0"}) as client:
                    res = await client.get(url.format(username))
                    body = res.text[:200].lower() if res.text else ""
                    exists = res.status_code == ok_status
                    if not_found_body and not_found_body.lower() in body:
                        exists = False
                    return name, url.format(username), exists
            except Exception:
                return name, url.format(username), None

    tasks = [check(n, u, s, b) for n, u, s, b in PLATFORMS]
    results = await asyncio.gather(*tasks)

    for name, url, exists in results:
        if exists is True:
            yield {"type": "found", "message": f"[FOUND] {name}: {url}"}
            found += 1
        elif exists is False:
            yield {"type": "info", "message": f"[NOT FOUND] {name}"}
        else:
            yield {"type": "warn", "message": f"[TIMEOUT] {name}"}

    yield {"type": "result", "message": f"Found on {found}/{len(PLATFORMS)} platforms"}
