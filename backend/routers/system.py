from __future__ import annotations
import shutil
from fastapi import APIRouter

router = APIRouter(prefix="/api/system", tags=["system"])

TOOL_DEPS = {
    "nmap":    {"name": "Nmap",    "required_for": ["Port Scan", "Nmap Raw"],       "install": "https://nmap.org/download"},
    "nuclei":  {"name": "Nuclei",  "required_for": ["Nuclei Scanner"],              "install": "https://github.com/projectdiscovery/nuclei"},
    "sqlmap":  {"name": "sqlmap",  "required_for": ["SQLMap Runner"],               "install": "https://github.com/sqlmapproject/sqlmap"},
}

@router.get("/deps")
async def check_deps():
    result = {}
    for cmd, meta in TOOL_DEPS.items():
        path = shutil.which(cmd)
        result[cmd] = {
            **meta,
            "installed": path is not None,
            "path": path,
        }
    return result
