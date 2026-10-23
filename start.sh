#!/data/data/com.termux/files/usr/bin/bash
# Starts the AI Yard Guardian in the background

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Prevent CPU from sleeping
termux-wake-lock 2>/dev/null || true

# Check if already running
if pgrep -f "python.*guardian.py" > /dev/null; then
    echo "⚠️  AI Yard Guardian is already running!"
    exit 0
fi

echo "🚀 Starting AI Yard Guardian in background..."
nohup python guardian.py > guardian.log 2>&1 &
PID=$!
echo "✅ Started with PID: $PID"
echo "📜 View live logs with: tail -f guardian.log"
