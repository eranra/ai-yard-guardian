#!/data/data/com.termux/files/usr/bin/bash
# Runs AI Yard Guardian directly in foreground for testing

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

termux-wake-lock 2>/dev/null || true

echo "🧪 Running AI Yard Guardian in Interactive Test Mode..."
echo "Press Ctrl+C to exit."
echo ""

python guardian.py
