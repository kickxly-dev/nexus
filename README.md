# Nexus Security Toolkit

All-in-one security toolkit with a dark cyberpunk desktop UI. Built for authorized pentesting, CTF competitions, security research, and bug bounty hunting.

## Requirements

- **Node.js** 18+
- **Python** 3.9+
- **nmap** installed and on PATH (for port scanning / network mapping)
- **Scapy** — requires admin/root for ARP scan and packet capture

## Setup

```bash
# Install all dependencies
npm install
cd renderer && npm install && cd ..
cd backend && pip install -r requirements.txt && cd ..
```

## Run (Dev Mode)

```bash
# Option 1: Use the batch file (Windows)
start-dev.bat

# Option 2: Manual
# Terminal 1 - Backend
cd backend && set NEXUS_PORT=7331 && python main.py

# Terminal 2 - Frontend + Electron
npm run dev
```

## Modules

| Module | Tools |
|--------|-------|
| **Recon / OSINT** | DNS lookup, WHOIS, Port scan, Subdomain enum, Tech fingerprint |
| **Web Exploitation** | Header analyzer, Directory bruteforce, SQLi tester, XSS scanner |
| **Network Tools** | Service detection, ARP scanner, Network mapper, Packet capture |
| **Password / Auth** | Hash identifier, Hash cracker, Wordlist generator, Credential tester |

## Legal Notice

This tool is for **authorized security testing only**. Only use on systems you own or have explicit written permission to test. Unauthorized use is illegal.
