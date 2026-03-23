from fastapi import APIRouter, Query
from utils.streamer import stream_response
from modules.osint.email_recon import email_recon
from modules.osint.username_check import username_check
from modules.osint.ssl_cert import ssl_inspect
from modules.osint.breach_check import breach_check

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
