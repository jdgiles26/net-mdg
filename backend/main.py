from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import asyncio
import time
from scapy.all import AsyncSniffer, IP, UDP


app = FastAPI(title="Mission Data Grid Controller")

# Allow React frontend to connect
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
    dst_port: int = 0  # Optional: specific port for this mission


# In-memory grid state - keyed by destination port instead of source IP
active_priorities = {}
packet_hits = []
connected_clients = []


def packet_callback(packet):
    """
    The core intercept logic. Triggered by AsyncSniffer when a packet is detected.
    Uses destination port to differentiate missions (allows same source IP).
    """
    if IP in packet and UDP in packet:
        src_ip = packet[IP].src
        dst_port = packet[UDP].dport
        
        # Check if the packet's destination port matches an active Autonet Intent
        if dst_port in active_priorities:
            pkt_size = len(packet)
            mission = active_priorities[dst_port]
            hit_data = {
                "id": time.time(),
                "src": src_ip,
                "dst_port": dst_port,
                "mission_id": mission["mission_id"],
                "priority": mission["level"],
                "size": pkt_size,
                "fragmented": pkt_size > 500  # SDNROUTE fragmentation threshold logic
            }
            packet_hits.append(hit_data)
            # Keep only the last 40 packets in memory for the UI stream
            if len(packet_hits) > 40:
                packet_hits.pop(0)


@app.on_event("startup")
async def startup_event():
    # Start the network sensor in the background.
    # Listens on all interfaces/loopback for testing.
    sniffer = AsyncSniffer(filter="udp", prn=packet_callback, store=0)
    sniffer.start()
    print("[SYSTEM] Asynchronous Sensor Connector Online.")


@app.post("/intercept/autonet")
async def receive_intent(signal: AutonetSignal):
    # Use destination port as the key for mission differentiation
    # This allows multiple missions even with same source IP
    port = signal.dst_port if signal.dst_port else hash(signal.mission_id) % 50000 + 10000
    active_priorities[port] = {
        "mission_id": signal.mission_id,
        "level": signal.priority_level,
        "intent": signal.intent,
        "source_ip": signal.source_ip,
        "timestamp": time.time(),
        "port": port
    }
    return {"status": "Intent Registered", "mission": signal.mission_id, "port": port}


@app.websocket("/ws/grid")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            # Stream live SDNROUTE data to the React UI every 200ms
            payload = {
                "intents": active_priorities,
                "packets": packet_hits[-20:]
            }
            await websocket.send_json(payload)
            await asyncio.sleep(0.2)
    except WebSocketDisconnect:
        connected_clients.remove(websocket)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
