import os
import sys
from pathlib import Path

PORT = int(os.environ.get("NEXUS_PORT", 7331))

# When frozen by PyInstaller, data files sit next to the .exe
if getattr(sys, "frozen", False):
    BASE_DIR = Path(sys.executable).parent
else:
    BASE_DIR = Path(__file__).parent

DATA_DIR = BASE_DIR / "data"
WORDLISTS_DIR = DATA_DIR / "wordlists"
PAYLOADS_DIR = DATA_DIR / "payloads"

# Default wordlists (bundled)
DEFAULT_SUBDOMAIN_WORDLIST = WORDLISTS_DIR / "subdomains.txt"
DEFAULT_DIRBRUTE_WORDLIST = WORDLISTS_DIR / "directories.txt"
DEFAULT_CRACK_WORDLIST = WORDLISTS_DIR / "rockyou_top10k.txt"

# Timeouts
HTTP_TIMEOUT = 10
DNS_TIMEOUT = 5
SCAN_TIMEOUT = 30

# Rate limiting
CREDENTIAL_DELAY = 0.5  # seconds between credential attempts
MAX_CONCURRENT_REQUESTS = 20
