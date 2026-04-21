import requests
import time
import random
import sys
import socket


API_URL = "http://localhost:8000/intercept/autonet"
REPORT_URL = "http://localhost:8000/report/packet"

# Enhanced Autonet Mission Set - 6 concurrent operations
missions = [
    {"id": "OP-VALKYRIE",  "ip": "127.0.0.1", "port": 50001, "intent": "SECURE_VOIP_UPLINK",    "priority": 10},
    {"id": "OP-AEGIS",     "ip": "127.0.0.1", "port": 50002, "intent": "TELEMETRY_DATALINK",     "priority": 6},
    {"id": "OP-PHANTOM",   "ip": "127.0.0.1", "port": 50003, "intent": "ENCRYPTED_C2_RELAY",     "priority": 9},
    {"id": "OP-SENTINEL",  "ip": "127.0.0.1", "port": 50004, "intent": "SIGINT_COLLECTION",      "priority": 7},
    {"id": "OP-HARBINGER", "ip": "127.0.0.1", "port": 50005, "intent": "MESH_REBROADCAST",       "priority": 4},
    {"id": "OP-ECLIPSE",   "ip": "127.0.0.1", "port": 50006, "intent": "COVERT_EXFIL_CHANNEL",   "priority": 8},
]

# Packet size profiles per intent type
SIZE_PROFILES = {
    "SECURE_VOIP_UPLINK":    (120, 400),
    "TELEMETRY_DATALINK":    (50, 300),
    "ENCRYPTED_C2_RELAY":    (200, 900),
    "SIGINT_COLLECTION":     (300, 700),
    "MESH_REBROADCAST":      (80, 500),
    "COVERT_EXFIL_CHANNEL":  (400, 1000),
}


def wait_for_backend(retries=15, delay=2):
    for i in range(retries):
        try:
            requests.get("http://localhost:8000/docs", timeout=2)
            return True
        except Exception:
            if i < retries - 1:
                print(f"  [.] Waiting for backend... ({i + 1}/{retries})")
                time.sleep(delay)
    return False


def send_packet(target, size):
    """Send UDP packet and report directly to backend."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(bytes(random.getrandbits(8) for _ in range(size)),
                     (target["ip"], target["port"]))
        sock.close()
    except Exception:
        pass
    try:
        requests.post(REPORT_URL, json={
            "mission_id": target["id"],
            "dst_port": target["port"],
            "size": size,
            "source_ip": target["ip"],
        }, timeout=1)
    except Exception:
        pass


print()
print("=" * 62)
print("   AUTONET INTENT SIMULATOR v2.0")
print("   Mission Data Grid - Packet Injection Engine")
print("=" * 62)
print()

print(">>> Connecting to MDG Controller...")
if not wait_for_backend():
    print("[!] Controller offline. Exiting.")
    sys.exit(1)
print("[+] Connected.\n")

print(">>> Deploying mission intents...")
for m in missions:
    try:
        requests.post(API_URL, json={
            "mission_id": m["id"],
            "priority_level": m["priority"],
            "source_ip": m["ip"],
            "intent": m["intent"],
            "dst_port": m["port"],
        })
        bar = "\u2588" * m["priority"] + "\u2591" * (10 - m["priority"])
        print(f"  [+] {m['id']:15s} :{m['port']} P{m['priority']:2d} [{bar}] {m['intent']}")
    except Exception as e:
        print(f"  [!] Failed: {m['id']} - {e}")
        sys.exit(1)

print(f"\n>>> {len(missions)} missions active. Injecting packets...")
print(">>> Ctrl+C to stop.\n")
print("-" * 62)

try:
    n = 0
    weights = [m["priority"] for m in missions]
    while True:
        target = random.choices(missions, weights=weights, k=1)[0]
        lo, hi = SIZE_PROFILES.get(target["intent"], (100, 800))
        size = random.randint(lo, hi)

        send_packet(target, size)
        frag = " FRAG" if size > 500 else ""
        print(f"  [{n:05d}] {target['id']:15s} {size:4d}B P{target['priority']:2d} :{target['port']}{frag}")
        n += 1

        # Occasional burst for threat detection testing
        if random.random() < 0.08:
            burst_count = random.randint(3, 7)
            for _ in range(burst_count):
                bt = random.choice(missions)
                bs = random.randint(50, 600)
                send_packet(bt, bs)
                print(f"  [{n:05d}] {bt['id']:15s} {bs:4d}B P{bt['priority']:2d} :{bt['port']} BURST")
                n += 1
                time.sleep(random.uniform(0.03, 0.12))

        time.sleep(random.uniform(0.3, 1.2))

except KeyboardInterrupt:
    print(f"\n{'=' * 62}")
    print(f"  Terminated. {n} packets injected.")
    print(f"{'=' * 62}")
