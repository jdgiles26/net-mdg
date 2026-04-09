# Mission Data Grid

A real-time network packet interception and visualization system with a decoupled architecture featuring a Python/FastAPI backend and a React/Vite frontend.

## Architecture Overview

```
┌─────────────────┐     WebSocket      ┌──────────────────┐
│   React UI      │◄──────────────────►│  FastAPI Backend │
│  (Port 5173)    │   Real-time Data   │   (Port 8000)    │
└─────────────────┘                    └──────────────────┘
                                              │
                                              │ AsyncSniffer
                                              ▼
                                       ┌──────────────────┐
                                       │   Scapy Sensor   │
                                       │  (Packet Intercept)
                                       └──────────────────┘
```

## Project Structure

```
mission-data-grid/
├── backend/
│   ├── main.py              # FastAPI server with WebSocket + Scapy sensor
│   ├── simulator.py         # Autonet intent simulator & packet injector
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main mission dashboard component
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Tailwind styles
│   ├── index.html           # HTML template
│   ├── package.json         # Node dependencies
│   ├── vite.config.js       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS config
│   └── postcss.config.js    # PostCSS config
└── README.md                # This file
```

## Prerequisites

- Python 3.8+
- Node.js 18+
- Administrator/root privileges (for packet sniffing)

## Installation

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

## Execution Instructions

### Step 1: Start the Backend Controller (Requires Admin/Root)

Open a terminal and run with elevated privileges:

**Linux/macOS:**
```bash
cd backend
sudo python main.py
```

**Windows:**
Open Command Prompt as Administrator, then:
```bash
cd backend
python main.py
```

You should see: `[SYSTEM] Asynchronous Sensor Connector Online.`

### Step 2: Start the React Mission UI

Open a second terminal (no admin required):

```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:5173` in your browser.

The dashboard will connect to the WebSocket and the **AUTONET STATUS** indicator will turn **green**.

### Step 3: Trigger the Simulation

Open a third terminal:

```bash
cd backend
./start-simulator.sh  # or: python simulator.py
```

The simulator will:
1. Register two Autonet intents (OP-VALKYRIE, OP-AEGIS)
2. Begin injecting raw ICMP packets into the loopback interface

Watch the browser - packets will stream across the SDNROUTE visualizer in real-time!

## Features

- **Real-time Packet Interception**: Uses Scapy's AsyncSniffer for non-blocking packet capture
- **WebSocket Communication**: Zero-latency UI updates via FastAPI WebSockets
- **2026-Style Futuristic UI**: Built with React 18, Tailwind CSS, and Framer Motion
- **Priority-Based Visualization**: Color-coded by priority level (Critical/High/Standard)
- **Fragmentation Detection**: Visual indicators for packets exceeding 500 bytes
- **Autonet Intent System**: Mission registration with priority levels and source IP tracking

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/intercept/autonet` | POST | Register mission intents |
| `/ws/grid` | WebSocket | Real-time data stream |

## Technologies Used

### Backend
- **FastAPI** - Modern Python web framework
- **Scapy** - Packet manipulation and sniffing
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

## Troubleshooting

- **Permission Denied**: Ensure you run the backend with sudo/admin privileges
- **Port Already in Use**: Change ports in `main.py` (8000) or `vite.config.js` (5173)
- **WebSocket Connection Failed**: Verify the backend is running and firewall allows connections

## License

MIT
