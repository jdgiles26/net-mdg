import requests
import time
import random
import sys
import socket


API_URL = "http://localhost:8000/intercept/autonet"

# Simulated Autonet Intents - differentiated by destination port
# Both use loopback (127.0.0.1) but different ports for mission identification
missions = [
    {"id": "OP-VALKYRIE", "ip": "127.0.0.1", "port": 50001, "intent": "SECURE_VOIP_UPLINK", "priority": 10},
    {"id": "OP-AEGIS", "ip": "127.0.0.1", "port": 50002, "intent": "TELEMETRY_DATALINK", "priority": 6}
]


print(">>> Initializing Autonet Intent Simulator...")

# 1. Send Intents to the FastAPI Northbound Connector
for mission in missions:
    payload = {
        "mission_id": mission["id"],
        "priority_level": mission["priority"],
        "source_ip": mission["ip"],
        "intent": mission["intent"],
        "dst_port": mission["port"]
    }
    try:
        r = requests.post(API_URL, json=payload)
        result = r.json()
        print(f"[+] Intent Deployed: {mission['id']} -> port {mission['port']} (Priority: {mission['priority']})")
    except Exception as e:
        print(f"[!] Controller Offline. Start main.py first. Error: {e}")
        sys.exit(1)


print("\n>>> Injecting mission packets via UDP sockets...")
print(">>> Press Ctrl+C to terminate simulation.\n")

# 2. Inject packets using standard UDP sockets (no root required)
# Each mission sends to its specific destination port for identification
try:
    while True:
        target = random.choice(missions)
        # Randomize packet size to test fragmentation logic
        payload_size = random.randint(100, 800)
        
        # Create a UDP socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        
        # Send to the mission-specific port on loopback
        data = b"X" * payload_size
        sock.sendto(data, (target["ip"], target["port"]))
        sock.close()
        
        frag_marker = " [FRAGMENTED]" if payload_size > 500 else ""
        print(f"--> Sent {payload_size:3d} bytes to {target['id']} (port {target['port']}){frag_marker}")
        
        # Random jitter
        time.sleep(random.uniform(0.3, 1.5))
except KeyboardInterrupt:
    print("\n[!] Simulation Terminated.")
