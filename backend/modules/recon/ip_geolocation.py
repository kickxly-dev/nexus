import httpx

async def ip_geolocation(ip: str):
    yield {"type": "info", "message": f"Looking up geolocation for {ip}..."}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(f"http://ip-api.com/json/{ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query")
            data = res.json()
            if data.get("status") == "success":
                yield {"type": "found", "message": f"IP: {data.get('query')}"}
                yield {"type": "found", "message": f"Location: {data.get('city')}, {data.get('regionName')}, {data.get('country')}"}
                yield {"type": "found", "message": f"Coordinates: {data.get('lat')}, {data.get('lon')}"}
                yield {"type": "found", "message": f"ISP: {data.get('isp')}"}
                yield {"type": "found", "message": f"Org: {data.get('org')}"}
                yield {"type": "found", "message": f"AS: {data.get('as')}"}
                yield {"type": "found", "message": f"Timezone: {data.get('timezone')}"}
                yield {"type": "found", "message": f"Zip: {data.get('zip')}"}
            else:
                yield {"type": "error", "message": f"Lookup failed: {data.get('message', 'Unknown error')}"}
    except Exception as e:
        yield {"type": "error", "message": str(e)}
