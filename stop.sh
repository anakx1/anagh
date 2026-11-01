#!/data/data/com.termux/files/usr/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PID_FILE="$DIR/.server.pid"

if [ -f "$PID_FILE" ]; then
    read SERVER_PID TUNNEL_PID < "$PID_FILE"
    echo "🛑 Stopping web server (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null || true
    echo "🛑 Stopping Cloudflare tunnel (PID: $TUNNEL_PID)..."
    kill $TUNNEL_PID 2>/dev/null || true
    rm -f "$PID_FILE"
else
    echo "Cleaning up any running background instances..."
    pkill -f "python3.*server.py" 2>/dev/null || true
    pkill -f "python3 -m http.server 8080" 2>/dev/null || true
    pkill -f "cloudflared tunnel" 2>/dev/null || true
fi

echo "🔋 Releasing wake lock..."
termux-wake-unlock 2>/dev/null || true

echo "✅ Portfolio server stopped."
