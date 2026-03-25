from fastapi import APIRouter, Query
from utils.streamer import stream_response
from utils.validator import validate_domain, validate_url, validate_port_range
from modules.recon.dns_lookup import dns_lookup
from modules.recon.whois_lookup import whois_lookup
from modules.recon.port_scanner import port_scan
from modules.recon.subdomain import enumerate_subdomains
from modules.recon.tech_fingerprint import fingerprint
from modules.recon.reverse_dns import reverse_dns
from modules.recon.ip_geolocation import ip_geolocation
from modules.recon.traceroute import traceroute
from modules.recon.asn_lookup import asn_lookup
from modules.recon.subdomain_takeover import subdomain_takeover
from modules.recon.cert_transparency import cert_transparency
from modules.recon.banner_grab import banner_grab
from modules.recon.waf_detector import waf_detect
from modules.recon.cms_detector import cms_detect

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


@router.get("/reversedns")
async def rev_dns(ip: str = Query(...)):
    return stream_response(reverse_dns(ip))


@router.get("/geoip")
async def geoip(ip: str = Query(...)):
    return stream_response(ip_geolocation(ip))


@router.get("/traceroute")
async def trace(target: str = Query(...), max_hops: int = Query(30)):
    return stream_response(traceroute(target, max_hops))


@router.get("/asn")
async def asn(target: str = Query(...)):
    return stream_response(asn_lookup(target))


@router.get("/takeover")
async def takeover(domain: str = Query(...)):
    domain = validate_domain(domain)
    return stream_response(subdomain_takeover(domain))


@router.get("/certtransparency")
async def cert_trans(domain: str = Query(...)):
    domain = validate_domain(domain)
    return stream_response(cert_transparency(domain))


@router.get("/bannergrab")
async def banner(target: str = Query(...), ports: str = Query("22,80,443,8080")):
    return stream_response(banner_grab(target, ports))


@router.get("/waf")
async def waf(url: str = Query(...)):
    url = validate_url(url)
    return stream_response(waf_detect(url))


@router.get("/cms")
async def cms(url: str = Query(...)):
    url = validate_url(url)
    return stream_response(cms_detect(url))
