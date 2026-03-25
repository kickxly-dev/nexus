from fastapi import APIRouter, Query
from utils.streamer import stream_response
from modules.osint.email_recon import email_recon
from modules.osint.username_check import username_check
from modules.osint.ssl_cert import ssl_inspect
from modules.osint.breach_check import breach_check
from modules.osint.ip_reputation import ip_reputation
from modules.osint.reverse_ip import reverse_ip_lookup
from modules.osint.github_dork import github_dork
from modules.osint.shodan_lookup import shodan_lookup

router = APIRouter(prefix="/api/osint", tags=["osint"])


@router.get("/email")
async def email(target: str = Query(...)):
    return stream_response(email_recon(target))


@router.get("/username")
async def username(target: str = Query(...)):
    return stream_response(username_check(target))


@router.get("/ssl")
async def ssl(host: str = Query(...), port: int = Query(443)):
    return stream_response(ssl_inspect(host, port))


@router.get("/breach")
async def breach(password: str = Query(...)):
    return stream_response(breach_check(password))


@router.get("/iprep")
async def iprep(ip: str = Query(...)):
    return stream_response(ip_reputation(ip))


@router.get("/reverseip")
async def reverseip(ip: str = Query(...)):
    return stream_response(reverse_ip_lookup(ip))


@router.get("/github")
async def github(query: str = Query(...), token: str = Query(None)):
    return stream_response(github_dork(query, token))


@router.get("/shodan")
async def shodan(target: str = Query(...), api_key: str = Query(None)):
    return stream_response(shodan_lookup(target, api_key))
