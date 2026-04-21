#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  MISSION DATA GRID - Unified Startup Script
#  Starts backend, frontend, and simulator in one command.
#  Usage: ./start.sh
# ═══════════════════════════════════════════════════════════════

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDS=()

cleanup() {
    echo ""
    echo -e "\033[33m[MDG] Shutting down all services...\033[0m"
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null
    done
    wait 2>/dev/null
    echo -e "\033[32m[MDG] All services stopped.\033[0m"
}
trap cleanup SIGINT SIGTERM EXIT

echo -e "\033[36m\033[1m"
cat << 'BANNER'
  ╔════════════════════════════════════════════════════════╗
  ║          MISSION DATA GRID  ///  v2.0                  ║
  ║          AutoNet Integration Platform                  ║
  ║          Network Operations & Intelligence             ║
  ╚════════════════════════════════════════════════════════╝
BANNER
echo -e "\033[0m"

# ─── Step 1: Prerequisites ─────────────────────────────────────
echo -e "\033[33m[1/5]\033[0m Checking prerequisites..."
MISSING=""
for cmd in python3 node npm; do
    command -v "$cmd" >/dev/null 2>&1 || MISSING="$MISSING $cmd"
done
if [ -n "$MISSING" ]; then
    echo -e "\033[31m  Missing:${MISSING}\033[0m"
    exit 1
fi
echo -e "\033[32m  All prerequisites met.\033[0m"

# ─── Step 2: Backend dependencies ──────────────────────────────
echo -e "\033[33m[2/5]\033[0m Installing backend dependencies..."
pip3 install -r "$DIR/backend/requirements.txt" -q 2>/dev/null || \
pip install -r "$DIR/backend/requirements.txt" -q 2>/dev/null || true
echo -e "\033[32m  Backend packages ready.\033[0m"

# ─── Step 3: Frontend dependencies ─────────────────────────────
echo -e "\033[33m[3/5]\033[0m Installing frontend dependencies..."
cd "$DIR/frontend" && npm install --silent 2>/dev/null
cd "$DIR"
echo -e "\033[32m  Frontend packages ready.\033[0m"

# ─── Step 4: Start backend ─────────────────────────────────────
echo -e "\033[33m[4/5]\033[0m Starting MDG Controller (port 8000)..."
python3 "$DIR/backend/main.py" > /tmp/mdg-backend.log 2>&1 &
PIDS+=($!)
sleep 2

if kill -0 "${PIDS[-1]}" 2>/dev/null; then
    echo -e "\033[32m  Backend online (PID: ${PIDS[-1]})\033[0m"
else
    echo -e "\033[31m  Backend failed to start. Log:\033[0m"
    cat /tmp/mdg-backend.log 2>/dev/null
    exit 1
fi

# ─── Step 5: Start frontend ────────────────────────────────────
echo -e "\033[33m[5/5]\033[0m Starting Mission UI (port 5173)..."
cd "$DIR/frontend" && npm run dev > /tmp/mdg-frontend.log 2>&1 &
PIDS+=($!)
cd "$DIR"
sleep 3

echo ""
echo -e "\033[36m\033[1m  ═══════════════════════════════════════════════\033[0m"
echo -e "\033[32m\033[1m  ◉ MISSION DATA GRID ONLINE\033[0m"
echo -e "\033[36m    Dashboard : \033[1mhttp://localhost:5173\033[0m"
echo -e "\033[36m    API       : \033[1mhttp://localhost:8000\033[0m"
echo -e "\033[36m    API Docs  : \033[1mhttp://localhost:8000/docs\033[0m"
echo -e "\033[36m\033[1m  ═══════════════════════════════════════════════\033[0m"
echo ""
echo -e "\033[2m  Launching simulator in 3 seconds...\033[0m"
sleep 3

# Run simulator in foreground (Ctrl+C stops everything via trap)
python3 "$DIR/backend/simulator.py"
