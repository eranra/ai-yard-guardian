# 🖥️ Local Analysis Server & Ingest Hub

The **Local Analysis Server** (`local_receiver.js`) is an optional, zero-dependency ingestion receiver that runs on your local computer (PC, Mac, Linux, or Raspberry Pi). 

It allows your AI Yard Guardian phone to stream **all text alerts, Telegram readouts, and high-resolution snapshot photos** directly to your computer over your home Wi-Fi in real-time.

---

## 🎯 Key Benefits

1. **Automated AI Analysis & False-Positive Debugging**:
   - Photos and evidence crops are saved directly to your PC's disk as standard `.jpg` files.
   - Antigravity (or any local script) can immediately open and inspect the images, check bounding box coordinates, and diagnose classifier outputs without manual file uploads.
2. **100% Private & Serverless**:
   - Runs entirely on your local Wi-Fi network. No cloud accounts, external databases, or third-party storage needed.
3. **Structured Event Logs**:
   - Appends all events to `received_events/events.jsonl` (machine-readable JSON Lines) and `received_events/events.log` (human-readable log).
   - Records exact timestamps, detection labels, confidence scores, bounding box coordinates, and message text.
4. **Independent from Telegram**:
   - Can run alongside Telegram Bot alerts, or as a 100% standalone logging system if you prefer not to use Telegram.

---

## 🚀 Quick Setup (3 Minutes)

### Step 1: Start the Local Receiver on your PC
Open a terminal in the project directory and run:

```bash
node local_receiver.js
```

*(By default, the server listens on port `8780`. You can specify a custom port if desired: `node local_receiver.js 9000`)*.

The server will output your local network IP addresses:

```text
======================================================
🛡️  AI Yard Guardian - Local Analysis Server & Logger
======================================================
📡 Listening on port: 8780
📁 Ingest storage directory:
   C:\Users\...\ai_yard_guardian\received_events

🌐 Available Local IP Addresses (Enter one into Yard Guardian):
   👉 http://192.168.1.109:8780

Endpoints ready:
   • GET  /api/status   - Health check & stats
   • POST /api/log      - Ingest text alerts & Telegram readouts
   • POST /api/upload   - Ingest snapshots & zoomed evidence crops
======================================================
```

---

### Step 2: Configure AI Yard Guardian on Your Phone

Make sure your phone is connected to the same home Wi-Fi network as your PC.

#### Option A: Via the Web UI
1. Open the AI Yard Guardian settings on your phone.
2. Scroll to **🖥️ Local Server Analysis & Ingest Hub**.
3. Check **Enable Local Server Relay**.
4. Enter your PC's local URL (e.g. `http://192.168.1.109:8780`).
5. Tap **📡 Test Connection**. You will see a green `✅ Connected` badge when successful!
6. *(Optional)* Under **⚡ Deterrent Activation Actions**, check **🖥️ Local Server Log & Relay** to ensure intruder alert photos are always forwarded to the local server.

#### Option B: Via Telegram Commands
If you already use the Telegram bot, you can configure it remotely:
* `/set localserver http://192.168.1.109:8780` — sets the URL and enables relay.
* `/set localserver on` or `/set localserver off` — toggles relay.
* `/action add local_server` — adds local server to active deterrent actions.

---

## 📁 Storage & Directory Layout

All data is stored inside the `received_events/` directory:

```text
ai_yard_guardian/
├── local_receiver.js
└── received_events/
    ├── 2026-10-30T10-45-12_cat_75pct.jpg      # Full yard context snapshot
    ├── 2026-10-30T10-45-13_cat_zoom.jpg       # Magnified 1:1 animal evidence crop
    ├── events.jsonl                           # Structured log (one JSON object per line)
    └── events.log                             # Human-readable plaintext log
```

### JSONL Event Schema (`events.jsonl`)

Each line in `events.jsonl` contains a complete event record:

```json
{
  "timestamp": 1793349912000,
  "dateStr": "10/30/2026, 10:45:12 AM",
  "isoTime": "2026-10-30T08:45:12.000Z",
  "type": "snapshot",
  "caption": "🎯 Intruder Alert: CAT (75% confidence)",
  "filename": "2026-10-30T08-45-12_cat_75pct.jpg",
  "filePath": "C:\\...\\received_events\\2026-10-30T08-45-12_cat_75pct.jpg",
  "metadata": {
    "label": "cat",
    "score": 75,
    "bbox": [498, 137, 135, 86]
  }
}
```

---

## 🛠️ API Endpoints Reference

The local server exposes standard HTTP endpoints with full CORS headers:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/status` | Returns server health, uptime, and saved photo count. |
| `POST` | `/api/log` | Ingests text alerts, system messages, and Telegram readouts. |
| `POST` | `/api/upload` | Ingests base64-encoded JPEG snapshots with metadata. |

---

## 🔧 Troubleshooting

* **Test Connection Fails ("Unreachable")**:
  1. Confirm your phone and PC are connected to the same Wi-Fi router (guest Wi-Fi networks sometimes isolate devices).
  2. If Windows Defender Firewall prompts you when running `node local_receiver.js`, select **Allow access on Private networks**.
  3. Verify that your PC's IP address hasn't changed (e.g. check via `ipconfig` on Windows or `ifconfig` on Mac/Linux).
