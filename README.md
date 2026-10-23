# 🛡️ AI Yard Guardian (Android Edition)

Transform any Android phone into an autonomous 24/7 AI yard defender that detects intruder animals (cats, dogs, birds) and triggers your existing **Smart Life / Tuya** watering system.

---

## 📱 Quick Test on Your Samsung Phone (5 Minutes)

You can test this right now indoors on your Samsung device. In **Test Mode**, the phone will beep and log alerts when it sees an animal (or picture of a cat on your computer screen), without turning on actual water.

### Step 1: Install the Free Apps
1. Open Google Play Store and install **[IP Webcam](https://play.google.com/store/apps/details?id=com.pas.webcam)**.
2. Install **[Termux](https://f-droid.org/en/packages/com.termux/)** (Recommended from F-Droid or GitHub, as the Play Store version is outdated).

### Step 2: One-Line Automated Installation
Open **Termux** and run this single command:

```bash
pkg install -y git && git clone https://github.com/YOUR_USER/ai_yard_guardian.git || mkdir -p ~/ai_yard_guardian
```
*(If transferring files locally or copying, see the local copy section below).*

Run the installer:
```bash
cd ~/ai_yard_guardian
chmod +x install.sh
./install.sh
```

### Step 3: Run the Test
1. Open **IP Webcam**, scroll to the bottom, and tap **"Start server"**.
2. Switch back to **Termux** and run:
   ```bash
   test-guardian
   ```
3. Point your camera at a cat (or a picture of a cat on a computer monitor/tablet).
4. Watch the live detection log in Termux! You will see:
   ```
   🎯 Intruder Detected: CAT (confidence: 84.2%)
   🚨 [TEST MODE TRIGGERED] Target: CAT
   💦 Sprinklers ACTIVATED for 8 seconds!
   ```
5. Walk in front of the camera yourself — notice that it immediately says:
   ```
   👤 Human in frame! Safety hold active (deterrent disarmed).
   ```

---

## ⚙️ Connecting to Real Smart Life Watering (Xiaomi or Samsung)

When you are ready to connect to your real Smart Life sprinkler valve:

Edit `config.json` in Termux:
```bash
nano config.json
```

Change `"mode": "test"` to `"webhook"` or `"tinytuya"`:

### Option A: Webhook Mode (Easiest)
Link Smart Life with IFTTT or Home Assistant:
```json
"smart_life": {
  "mode": "webhook",
  "webhook_url": "https://maker.ifttt.com/trigger/cat_detected/with/key/YOUR_KEY"
}
```

### Option B: TinyTuya Local LAN Mode (Instant, ~100ms)
Direct local Wi-Fi control:
```json
"smart_life": {
  "mode": "tinytuya",
  "tinytuya": {
    "device_id": "YOUR_DEVICE_ID",
    "device_ip": "192.168.1.100",
    "local_key": "YOUR_LOCAL_KEY",
    "version": 3.3
  }
}
```

---

## 🚀 24/7 Permanent Deployment (Xiaomi Setup)

1. Connect the Xiaomi phone to a wall charger.
2. Under **Settings $\rightarrow$ Developer options**, enable **"Stay awake while charging"**.
3. Under **Settings $\rightarrow$ Apps $\rightarrow$ Termux**:
   - Set Battery Saver to **"No restrictions"**.
   - Enable **Autostart**.
4. In IP Webcam:
   - Check **"Start on device boot"**.
   - Tap **Actions $\rightarrow$ Deactivate display / Black screen** (keeps screen cold and black to prevent OLED burn-in).
5. Start the background guardian:
   ```bash
   start-guardian
   ```
   To check live logs:
   ```bash
   tail -f guardian.log
   ```
   To stop anytime:
   ```bash
   stop-guardian
   ```
