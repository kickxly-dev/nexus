import re
from urllib.parse import urlparse


def validate_domain(domain: str) -> str:
    domain = domain.strip().lower()
    # Strip protocol if provided
    if "://" in domain:
        domain = urlparse(domain).netloc or domain
    domain = domain.split("/")[0]
    if not re.match(r"^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*$", domain):
        raise ValueError(f"Invalid domain: {domain}")
    return domain


def validate_url(url: str) -> str:
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    parsed = urlparse(url)
    if not parsed.netloc:
        raise ValueError(f"Invalid URL: {url}")
    return url


def validate_ip_or_cidr(target: str) -> str:
    target = target.strip()
    cidr_re = r"^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$"
    if not re.match(cidr_re, target):
        raise ValueError(f"Invalid IP/CIDR: {target}")
    return target


def validate_port_range(ports: str) -> str:
    ports = ports.strip()
    if not re.match(r"^[\d,\-]+$", ports):
        raise ValueError(f"Invalid port range: {ports}")
    return ports


def validate_hash(hash_str: str) -> str:
    hash_str = hash_str.strip()
    if not re.match(r"^[a-fA-F0-9$2b$./:\*]+$", hash_str):
        raise ValueError(f"Invalid hash format")
    return hash_str
