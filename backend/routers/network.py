from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional
from utils.streamer import stream_response
from utils.validator import validate_ip_or_cidr
from modules.network.service_detect import detect_services
from modules.network.arp_scanner import arp_scan
from modules.network.net_mapper import map_network
from modules.network.packet_info import capture_packets
from modules.network.ping_sweep import ping_sweep
from modules.network.smb_enum import smb_enum
from modules.network.ssh_audit import ssh_audit
from modules.network.nmap_raw import nmap_raw
import asyncio

router = APIRouter(prefix="/api/network", tags=["network"])


@router.get("/services")
async def services(
    host: str = Query(...),
    ports: str = Query(None),
):
    port_list = None
    if ports:
        port_list = [int(p.strip()) for p in ports.split(",") if p.strip().isdigit()]
    return stream_response(detect_services(host, port_list))


@router.get("/arp")
async def arp(network: str = Query(...)):
    validate_ip_or_cidr(network)
    return stream_response(arp_scan(network))


@router.get("/map")
async def netmap(
    target: str = Query(...),
    deep: bool = Query(False),
):
    return stream_response(map_network(target, deep))


@router.get("/capture")
async def capture(
    iface: str = Query(None),
    count: int = Query(50),
    filter: str = Query(""),
):
    count = min(count, 500)  # safety cap
    return stream_response(capture_packets(iface, count, filter))


@router.get("/pingsweep")
async def pingsweep(network: str = Query(...)):
    validate_ip_or_cidr(network)
    return stream_response(ping_sweep(network))


@router.get("/smb")
async def smb(target: str = Query(...)):
    return stream_response(smb_enum(target))


@router.get("/ssh")
async def ssh(target: str = Query(...), port: int = Query(22)):
    return stream_response(ssh_audit(target, port))


@router.get("/nmap")
async def nmap(target: str = Query(...), flags: str = Query("-sV --script=default")):
    return stream_response(nmap_raw(target, flags))
