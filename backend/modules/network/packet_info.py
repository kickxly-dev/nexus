import asyncio
from typing import AsyncGenerator


async def capture_packets(iface: str = None, count: int = 50, bpf_filter: str = "") -> AsyncGenerator:
    yield {"type": "info", "message": f"Capturing {count} packets" + (f" on {iface}" if iface else "") + (f" filter: '{bpf_filter}'" if bpf_filter else "")}
    yield {"type": "warn", "message": "Packet capture requires administrator/root privileges"}

    try:
        from scapy.all import sniff, IP, TCP, UDP, ICMP, Ether, IPv6

        captured = []

        def packet_callback(pkt):
            captured.append(pkt)

        def do_sniff():
            kwargs = {"count": count, "prn": packet_callback, "store": False, "timeout": 30}
            if iface:
                kwargs["iface"] = iface
            if bpf_filter:
                kwargs["filter"] = bpf_filter
            sniff(**kwargs)

        # Run sniff in thread since it's blocking
        task = asyncio.to_thread(do_sniff)

        # Stream results as packets come in — we poll captured list
        start_len = 0
        sniff_task = asyncio.create_task(task)

        while not sniff_task.done():
            await asyncio.sleep(0.2)
            while start_len < len(captured):
                pkt = captured[start_len]
                start_len += 1
                info = summarize_packet(pkt)
                yield info

        # Drain remaining
        while start_len < len(captured):
            pkt = captured[start_len]
            start_len += 1
            yield summarize_packet(pkt)

        yield {"type": "done", "message": f"Capture complete. {len(captured)} packets captured."}

    except PermissionError:
        yield {"type": "error", "message": "Permission denied. Run as Administrator/root."}
    except ImportError:
        yield {"type": "error", "message": "Scapy not installed."}
    except Exception as e:
        yield {"type": "error", "message": f"Capture error: {str(e)}"}


def summarize_packet(pkt) -> dict:
    try:
        from scapy.all import IP, TCP, UDP, ICMP, Ether

        summary = {"type": "data"}

        if pkt.haslayer(IP):
            summary["src"] = pkt[IP].src
            summary["dst"] = pkt[IP].dst
            summary["proto"] = pkt[IP].proto

        if pkt.haslayer(TCP):
            summary["l4"] = "TCP"
            summary["sport"] = pkt[TCP].sport
            summary["dport"] = pkt[TCP].dport
            flags = pkt[TCP].flags
            summary["flags"] = str(flags)
            summary["message"] = f"[TCP] {summary.get('src','?')}:{pkt[TCP].sport} → {summary.get('dst','?')}:{pkt[TCP].dport} [{flags}]"
        elif pkt.haslayer(UDP):
            summary["l4"] = "UDP"
            summary["sport"] = pkt[UDP].sport
            summary["dport"] = pkt[UDP].dport
            summary["message"] = f"[UDP] {summary.get('src','?')}:{pkt[UDP].sport} → {summary.get('dst','?')}:{pkt[UDP].dport}"
        elif pkt.haslayer(ICMP):
            summary["l4"] = "ICMP"
            summary["message"] = f"[ICMP] {summary.get('src','?')} → {summary.get('dst','?')} type={pkt[ICMP].type}"
        else:
            summary["message"] = pkt.summary()

        return summary
    except Exception:
        return {"type": "data", "message": str(pkt.summary())}
