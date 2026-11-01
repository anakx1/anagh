#!/data/data/com.termux/files/usr/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PID_FILE="$DIR/.server.pid"
LOG_TUNNEL="$DIR/tunnel.log"
LOG_SERVER="$DIR/server.log"

if [ -f "$PID_FILE" ]; then
    echo "⚠️ Server is already recorded as running. Run ./stop.sh first."
    exit 1
fi

echo "🔋 Acquiring Termux wake lock to prevent sleep..."
termux-wake-lock 2>/dev/null || true

echo "🚀 Starting local HTTP & Telemetry server on port 8080..."
nohup python3 "$DIR/server.py" > "$LOG_SERVER" 2>&1 &
SERVER_PID=$!

echo "🌐 Launching Cloudflare Tunnel..."
rm -f "$LOG_TUNNEL"
nohup cloudflared tunnel --url http://127.0.0.1:8080 > "$LOG_TUNNEL" 2>&1 &
TUNNEL_PID=$!

disown -a


echo "$SERVER_PID $TUNNEL_PID" > "$PID_FILE"

echo "⏳ Waiting for public tunnel URL..."
PUBLIC_URL=""
for i in {1..15}; do
    sleep 1
    PUBLIC_URL=$(grep -o 'https://[-a-zA-Z0-9.]*trycloudflare.com' "$LOG_TUNNEL" | head -n 1)
    if [ -n "$PUBLIC_URL" ]; then
        break
    fi
done

echo ""
echo "=========================================================="
if [ -n "$PUBLIC_URL" ]; then
    echo "✅ PORTFOLIO IS LIVE ON THE PUBLIC INTERNET!"
    echo "🔗 URL: $PUBLIC_URL"
else
    echo "⚠️ Tunnel started, but URL could not be parsed immediately."
    echo "Check log: cat $LOG_TUNNEL"
fi
echo "=========================================================="
echo "To stop hosting anytime, run: ./stop.sh"
