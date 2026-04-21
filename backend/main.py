from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import asyncio
import time
import random
import platform
from collections import defaultdict, deque


@asynccontextmanager
async def lifespan(app):
    log_event("SYSTEM", "MDG Controller initialized")
    log_event("SYSTEM", f"Platform: {platform.system()} {platform.release()}")
    try:
        from scapy.all import AsyncSniffer
        iface = "lo0" if platform.system() == "Darwin" else "lo"
        sniffer = AsyncSniffer(iface=iface, filter="udp", prn=sniffer_callback, store=0)
        sniffer.start()
        log_event("SYSTEM", f"Sniffer active on {iface}")
        print(f"[SYSTEM] Sniffer active on {iface}", flush=True)
    except Exception as e:
        log_event("SYSTEM", f"Sniffer unavailable: {e}", severity="WARNING")
        print(f"[SYSTEM] Sniffer unavailable ({e}). Direct reporting active.", flush=True)
    print("[SYSTEM] Mission Data Grid Controller Online.", flush=True)
    asyncio.create_task(throughput_loop())
    yield


app = FastAPI(title="Mission Data Grid Controller", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AutonetSignal(BaseModel):
    mission_id: str
    priority_level: int
    source_ip: str
    intent: str
    dst_port: int = 0


class PacketReport(BaseModel):
    mission_id: str
    dst_port: int
    size: int
    source_ip: str = "127.0.0.1"


# ─── State ─────────────────────────────────────────────────────
active_priorities = {}
packet_hits = deque(maxlen=50)
connected_clients = []
event_timeline = deque(maxlen=200)
threat_alerts = deque(maxlen=50)
health_metrics = {}
start_time = time.time()

analytics = {
    "total_packets": 0,
    "total_bytes": 0,
    "throughput_history": deque(maxlen=60),
    "mission_packets": defaultdict(int),
    "mission_bytes": defaultdict(int),
    "mission_last_seen": {},
}

_freq_tracker = defaultdict(list)


# ─── Helpers ───────────────────────────────────────────────────
def log_event(etype, msg, mission_id=None, severity="INFO"):
    event_timeline.append({
        "id": time.time(),
        "timestamp": time.time(),
        "type": etype,
        "message": msg,
        "mission_id": mission_id,
        "severity": severity,
    })


def detect_threats(pkt):
    now = time.time()
    mid = pkt["mission_id"]
    _freq_tracker[mid].append(now)
    _freq_tracker[mid] = [t for t in _freq_tracker[mid] if now - t < 10]

    recent = [t for t in _freq_tracker[mid] if now - t < 3]
    if len(recent) > 5:
        threat_alerts.append({
            "id": now,
            "timestamp": now,
            "rule": "HIGH_FREQ_BURST",
            "severity": "HIGH",
            "mission_id": mid,
            "message": f"Burst: {len(recent)} pkts in 3s on {mid}",
        })

    if pkt["size"] > 700:
        threat_alerts.append({
            "id": now + 0.001,
            "timestamp": now,
            "rule": "OVERSIZED_PAYLOAD",
            "severity": "MEDIUM",
            "mission_id": mid,
            "message": f"Large payload ({pkt['size']}B) on {mid}",
        })

    recent_frags = [p for p in list(packet_hits)[-10:]
                    if p.get("fragmented") and p["mission_id"] == mid]
    if len(recent_frags) >= 3:
        threat_alerts.append({
            "id": now + 0.002,
            "timestamp": now,
            "rule": "FRAG_STORM",
            "severity": "CRITICAL",
            "mission_id": mid,
            "message": f"Frag storm: {len(recent_frags)} fragmented on {mid}",
        })
        log_event("THREAT", f"Fragmentation storm detected on {mid}", mid, "CRITICAL")


def process_packet(dst_port, size, source_ip="127.0.0.1"):
    if dst_port not in active_priorities:
        return None
    mission = active_priorities[dst_port]
    mid = mission["mission_id"]
    hit = {
        "id": time.time(),
        "src": source_ip,
        "dst_port": dst_port,
        "mission_id": mid,
        "priority": mission["level"],
        "size": size,
        "fragmented": size > 500,
        "timestamp": time.time(),
    }
    packet_hits.append(hit)
    analytics["total_packets"] += 1
    analytics["total_bytes"] += size
    analytics["mission_packets"][mid] += 1
    analytics["mission_bytes"][mid] += size
    analytics["mission_last_seen"][mid] = time.time()
    detect_threats(hit)
    return hit


def compute_health():
    now = time.time()
    obf_map = {
        "SECURE_VOIP_UPLINK":   ("AES-256-GCM", "FREQ_HOP", "WIREGUARD"),
        "TELEMETRY_DATALINK":   ("CHACHA20", "SPREAD_SPECTRUM", "IPSEC"),
        "ENCRYPTED_C2_RELAY":   ("AES-256-CBC", "TRAFFIC_PAD", "TOR_BRIDGE"),
        "SIGINT_COLLECTION":    ("XCHACHA20", "BURST_TX", "STUNNEL"),
        "MESH_REBROADCAST":     ("AES-128-GCM", "MESH_ROTATE", "VXLAN"),
        "COVERT_EXFIL_CHANNEL": ("AES-256-GCM", "STEGO", "DNS_TUNNEL"),
    }
    for port, mission in active_priorities.items():
        mid = mission["mission_id"]
        last = analytics["mission_last_seen"].get(mid, 0)
        gap = now - last if last else 999
        recency = max(0, 100 - gap * 10)
        threats = len([t for t in threat_alerts
                      if t["mission_id"] == mid and now - t["timestamp"] < 30])
        penalty = min(threats * 15, 60)
        pkts = analytics["mission_packets"].get(mid, 0)
        flow = min(pkts * 2, 100)
        score = max(0, min(100, recency * 0.4 + flow * 0.4 + (100 - penalty) * 0.2))
        status = "DOWN" if gap > 10 else ("DEGRADED" if gap > 5 else "ACTIVE")
        intent = mission.get("intent", "")
        enc, obf, tun = obf_map.get(intent, ("AES-256", "STANDARD", "DIRECT"))
        health_metrics[mid] = {
            "mission_id": mid,
            "score": round(score, 1),
            "status": status,
            "last_seen": last,
            "packets": pkts,
            "bytes": analytics["mission_bytes"].get(mid, 0),
            "threats": threats,
            "latency_ms": round(random.uniform(1.2, 8.5), 1) if status == "ACTIVE" else 0,
            "jitter_ms": round(random.uniform(0.1, 2.0), 2) if status == "ACTIVE" else 0,
            "encryption": enc,
            "obfuscation": obf,
            "tunnel": tun,
            "port": port,
            "priority": mission["level"],
        }


def sniffer_callback(packet):
    try:
        from scapy.all import IP, UDP
        if IP in packet and UDP in packet:
            process_packet(packet[UDP].dport, len(packet), packet[IP].src)
    except Exception:
        pass


# ─── Routes ────────────────────────────────────────────────────
async def throughput_loop():
    prev_bytes = 0
    prev_pkts = 0
    while True:
        await asyncio.sleep(1)
        cur_b = analytics["total_bytes"]
        cur_p = analytics["total_packets"]
        analytics["throughput_history"].append({
            "t": time.time(),
            "bps": cur_b - prev_bytes,
            "pps": cur_p - prev_pkts,
        })
        prev_bytes = cur_b
        prev_pkts = cur_p
        compute_health()


@app.post("/intercept/autonet")
async def register_intent(signal: AutonetSignal):
    port = signal.dst_port if signal.dst_port else hash(signal.mission_id) % 50000 + 10000
    active_priorities[port] = {
        "mission_id": signal.mission_id,
        "level": signal.priority_level,
        "intent": signal.intent,
        "source_ip": signal.source_ip,
        "timestamp": time.time(),
        "port": port,
    }
    log_event("INTENT", f"{signal.mission_id} registered on :{port} (P{signal.priority_level})", signal.mission_id)
    return {"status": "Intent Registered", "mission": signal.mission_id, "port": port}


@app.post("/report/packet")
async def report_packet(report: PacketReport):
    """Direct packet reporting - bypasses loopback sniffing limitations."""
    hit = process_packet(report.dst_port, report.size, report.source_ip)
    if hit:
        return {"status": "recorded", "id": hit["id"]}
    return {"status": "no_matching_intent"}


@app.websocket("/ws/grid")
async def ws_grid(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    log_event("SYSTEM", "UI client connected")
    try:
        while True:
            history = list(analytics["throughput_history"])
            cur_bps = history[-1]["bps"] if history else 0
            cur_pps = history[-1]["pps"] if history else 0
            payload = {
                "intents": active_priorities,
                "packets": list(packet_hits)[-20:],
                "analytics": {
                    "total_packets": analytics["total_packets"],
                    "total_bytes": analytics["total_bytes"],
                    "bps": cur_bps,
                    "pps": cur_pps,
                    "uptime": time.time() - start_time,
                    "throughput_history": history[-30:],
                    "per_mission": {
                        mid: {
                            "packets": analytics["mission_packets"].get(mid, 0),
                            "bytes": analytics["mission_bytes"].get(mid, 0),
                        }
                        for mid in analytics["mission_packets"]
                    },
                },
                "threats": list(threat_alerts)[-20:],
                "health": health_metrics,
                "timeline": list(event_timeline)[-30:],
            }
            await websocket.send_json(payload)
            await asyncio.sleep(0.25)
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
        log_event("SYSTEM", "UI client disconnected")
    except Exception:
        if websocket in connected_clients:
            connected_clients.remove(websocket)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
