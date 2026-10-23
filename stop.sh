#!/data/data/com.termux/files/usr/bin/bash
# Stops running AI Yard Guardian instances

echo "🛑 Stopping AI Yard Guardian..."
pkill -f "python.*guardian.py" || true
echo "✅ Stopped."
