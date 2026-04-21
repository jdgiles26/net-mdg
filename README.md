# Mission Data Grid (MDG)

A real-time network packet interception, analytics, and intelligence platform designed as a companion tool for **AutoNet** network operations. MDG provides monitoring, threat detection, obfuscation visibility, and health tracking across active mission channels.

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                     REACT DASHBOARD (5173)                     │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │
│  │ COMMAND  │ │ANALYTICS │ │THREATS │ │NETWORK │ │ EVENTS │  │
│  └─────────┘ └──────────┘ └────────┘ └────────┘ └────────┘  │
└───────────────────────┬───────────────────────────────────────┘
                        │ WebSocket (250ms)
┌───────────────────────┴───────────────────────────────────────┐
│                   FASTAPI CONTROLLER (8000)                    │
│  ┌──────────────┐  ┌────────────┐  ┌───────────────────────┐ │
│  │ Packet Engine │  │ Threat IDS │  │ Health/Analytics Loop │ │
│  └──────────────┘  └────────────┘  └───────────────────────┘ │
└───────────────────────┬───────────────────────────────────────┘
                        │ Direct Reporting + UDP
┌───────────────────────┴───────────────────────────────────────┐
│                  AUTONET SIMULATOR (6 Missions)                │
│  OP-VALKYRIE · OP-AEGIS · OP-PHANTOM · OP-SENTINEL           │
│  OP-HARBINGER · OP-ECLIPSE                                    │
└───────────────────────────────────────────────────────────────┘
```

## Quick Start

**One command starts everything:**

```bash
./start.sh
```

This will:
1. Check prerequisites (python3, node, npm)
2. Install backend and frontend dependencies
3. Start the FastAPI controller on port 8000
4. Start the React dashboard on port 5173
5. Launch the packet simulator

Open **http://localhost:5173** in your browser.

Press `Ctrl+C` to stop all services.

## Dashboard Tabs

### COMMAND
Live mission intent viewer and real-time packet stream visualizer. Shows all active AutoNet intents with priority levels, packet counts, and a color-coded bar visualization of intercepted packets.

### ANALYTICS
Aggregate statistics with live throughput area chart. Tracks total packets, data volume, throughput (B/s), packet rate (pkt/s), active missions, and uptime. Includes per-mission breakdown cards.

### THREATS
Intrusion detection system with three active rules:
- **HIGH_FREQ_BURST** - Detects >5 packets in a 3-second window per mission
- **OVERSIZED_PAYLOAD** - Flags packets exceeding 700B
- **FRAG_STORM** - Alerts on 3+ fragmented packets in a sliding window

Shows severity-tagged alert feed (CRITICAL / HIGH / MEDIUM) with timestamps.

### NETWORK
Per-mission health monitoring. Each mission card displays:
- Health score (0-100%) with visual progress bar
- Link status (ACTIVE / DEGRADED / DOWN)
- Latency and jitter measurements
- Encryption protocol (AES-256-GCM, CHACHA20, etc.)
- Obfuscation method (FREQ_HOP, STEGO, TRAFFIC_PAD, etc.)
- Tunnel type (WIREGUARD, TOR_BRIDGE, DNS_TUNNEL, etc.)

### EVENTS
Chronological mission event log. Color-coded by severity with event type badges (SYSTEM, INTENT, THREAT). Tracks controller lifecycle, intent registrations, threat detections, and client connections.

## Missions

| Mission | Port | Priority | Intent | Encryption | Obfuscation |
|---------|------|----------|--------|------------|-------------|
| OP-VALKYRIE | 50001 | 10 | SECURE_VOIP_UPLINK | AES-256-GCM | FREQ_HOP |
| OP-PHANTOM | 50003 | 9 | ENCRYPTED_C2_RELAY | AES-256-CBC | TRAFFIC_PAD |
| OP-ECLIPSE | 50006 | 8 | COVERT_EXFIL_CHANNEL | AES-256-GCM | STEGO |
| OP-SENTINEL | 50004 | 7 | SIGINT_COLLECTION | XCHACHA20 | BURST_TX |
| OP-AEGIS | 50002 | 6 | TELEMETRY_DATALINK | CHACHA20 | SPREAD_SPECTRUM |
| OP-HARBINGER | 50005 | 4 | MESH_REBROADCAST | AES-128-GCM | MESH_ROTATE |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/intercept/autonet` | POST | Register a mission intent |
| `/report/packet` | POST | Direct packet reporting (bypasses sniffer) |
| `/ws/grid` | WebSocket | Real-time data stream (intents, packets, analytics, threats, health, timeline) |
| `/docs` | GET | Interactive API documentation |

## Project Structure

```
net-mdg/
├── start.sh                     # Unified startup script
├── backend/
│   ├── main.py                  # FastAPI controller + threat engine + analytics
│   ├── simulator.py             # 6-mission packet injector with burst patterns
│   └── requirements.txt         # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main layout + WebSocket + tab navigation
│   │   └── components/
│   │       ├── MissionCommand.jsx      # Intent list + packet stream
│   │       ├── AnalyticsDashboard.jsx  # Stats + throughput chart
│   │       ├── ThreatMonitor.jsx       # IDS rules + alert feed
│   │       ├── NetworkOps.jsx          # Health + encryption + obfuscation
│   │       └── EventTimeline.jsx       # Mission event log
│   ├── package.json
│   └── vite.config.js
├── start-backend.sh             # Individual startup (legacy)
├── start-frontend.sh            # Individual startup (legacy)
└── start-simulator.sh           # Individual startup (legacy)
```

## Prerequisites

- Python 3.8+
- Node.js 18+
- No root/sudo required (direct packet reporting bypasses loopback sniffing)

## Manual Setup (alternative to start.sh)

```bash
# Terminal 1: Backend
cd backend
pip install -r requirements.txt
python3 main.py

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Terminal 3: Simulator
cd backend
python3 simulator.py
```

## Technologies

**Backend:** FastAPI, Scapy (optional), Uvicorn, Pydantic
**Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide React

## License

MIT
