#!/usr/bin/env python3
"""
Launches the Web-based AI Yard Guardian dashboard.
Serves on http://localhost:8080 and opens it in your Android browser.
"""

import http.server
import os
import socketserver
import subprocess
import sys
import webbrowser

PORT = 8080
WEB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web_ui")

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def log_message(self, format, *args):
        # Quiet down server logs
        pass

def main():
    os.chdir(WEB_DIR)
    
    # Allow port reuse to avoid 'address already in use' errors
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("127.0.0.1", PORT), CustomHandler) as httpd:
        url = f"http://127.0.0.1:{PORT}"
        print("=" * 60)
        print("🛡️  AI Yard Guardian Web UI is Running!")
        print(f"👉 Open in your Android browser: {url}")
        print("=" * 60)

        # Try to open browser automatically
        try:
            if shutil_which := subprocess.run(["which", "termux-open-url"], capture_output=True, text=True):
                if "termux-open-url" in shutil_which.stdout:
                    subprocess.run(["termux-open-url", url])
                else:
                    webbrowser.open(url)
        except Exception:
            webbrowser.open(url)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down Web Guardian.")

if __name__ == "__main__":
    main()
