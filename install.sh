#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================================
# AI Yard Guardian - Automated Termux Installer for Android
# Compatible with: Samsung (One UI), Xiaomi (MIUI/HyperOS), Google Pixel, etc.
# ==============================================================================

set -e

echo ""
echo "=========================================================="
echo "🛡️  Installing AI Yard Guardian on Android..."
echo "=========================================================="
echo ""

# 1. Update Termux package mirrors and packages
echo "[1/5] Updating Termux packages..."
pkg update -y && pkg upgrade -y

# 2. Install essential dependencies: Python, git, curl, OpenCV, termux-api
echo "[2/5] Installing Python, OpenCV, and build tools..."
pkg install -y python python-pip python-numpy git curl wget termux-api

# Try to install python-opencv from termux repositories if available
pkg install -y opencv-python || true

# 3. Install required Python packages
echo "[3/5] Installing Python libraries (requests, tinytuya)..."
pip install --upgrade pip
pip install requests tinytuya numpy || true

# Try installing opencv-python-headless if pkg didn't have it
python -c "import cv2" 2>/dev/null || pip install opencv-python-headless || true

# 4. Acquire Termux wake lock so the CPU stays awake 24/7
echo "[4/5] Setting up 24/7 wake lock (prevents CPU sleep)..."
termux-wake-lock || true

# 5. Set up shortcuts in Termux bin
INSTALL_DIR=$(pwd)
chmod +x "$INSTALL_DIR/start.sh" "$INSTALL_DIR/stop.sh" "$INSTALL_DIR/test.sh" 2>/dev/null || true

PREFIX_BIN="/data/data/com.termux/files/usr/bin"
if [ -d "$PREFIX_BIN" ]; then
    echo "Creating shortcut commands: 'web-guardian', 'start-guardian', 'stop-guardian', 'test-guardian'..."
    cat << 'EOF' > "$PREFIX_BIN/web-guardian"
#!/data/data/com.termux/files/usr/bin/bash
cd $HOME/ai_yard_guardian && python run_web_guardian.py
EOF
    cat << 'EOF' > "$PREFIX_BIN/start-guardian"
#!/data/data/com.termux/files/usr/bin/bash
cd $HOME/ai_yard_guardian && ./start.sh
EOF
    cat << 'EOF' > "$PREFIX_BIN/stop-guardian"
#!/data/data/com.termux/files/usr/bin/bash
cd $HOME/ai_yard_guardian && ./stop.sh
EOF
    cat << 'EOF' > "$PREFIX_BIN/test-guardian"
#!/data/data/com.termux/files/usr/bin/bash
cd $HOME/ai_yard_guardian && ./test.sh
EOF
    chmod +x "$PREFIX_BIN/web-guardian" "$PREFIX_BIN/start-guardian" "$PREFIX_BIN/stop-guardian" "$PREFIX_BIN/test-guardian"
fi

echo ""
echo "=========================================================="
echo "🎉 Installation Complete!"
echo "=========================================================="
echo ""
echo "Quick Start Commands:"
echo "  test-guardian   -> Run interactively on screen (Test Mode)"
echo "  start-guardian  -> Run in background 24/7"
echo "  stop-guardian   -> Stop background guardian"
echo ""
echo "Make sure IP Webcam is running with 'Start server'!"
echo "=========================================================="
