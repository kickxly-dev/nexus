from fastapi import APIRouter, Query
from utils.streamer import stream_response
from utils.validator import validate_domain, validate_url, validate_port_range
from modules.recon.dns_lookup import dns_lookup
from modules.recon.whois_lookup import whois_lookup
from modules.recon.port_scanner import port_scan
from modules.recon.subdomain import enumerate_subdomains
from modules.recon.tech_fingerprint import fingerprint

router = APIRouter(prefix="/api/recon", tags=["recon"])


@router.get("/dns")
async def dns(domain: str = Query(...)):
    domain = validate_domain(domain)
    return stream_response(dns_lookup(domain))


@router.get("/whois")
async def whois(domain: str = Query(...)):
    domain = validate_domain(domain)
    return stream_response(whois_lookup(domain))


@router.get("/portscan")
async def portscan(
    target: str = Query(...),
    ports: str = Query("1-1000"),
    scan_type: str = Query("tcp"),
):
    ports = validate_port_range(ports)
    return stream_response(port_scan(target, ports, scan_type))


@router.get("/subdomains")
async def subdomains(
    domain: str = Query(...),
    wordlist: str = Query(None),
):
    domain = validate_domain(domain)
    return stream_response(enumerate_subdomains(domain, wordlist))


@router.get("/fingerprint")
async def tech_fingerprint(url: str = Query(...)):
    url = validate_url(url)
    return stream_response(fingerprint(url))
