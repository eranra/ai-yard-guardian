# 🛡️ AI Yard Guardian (Web / PWA)

A zero-install, on-device AI yard monitoring and wildlife deterrent system that runs directly inside your phone's browser, connects to **Telegram** for remote monitoring and two-way control, and triggers your **Smart Life / Tuya** watering system.

🔗 **Live App:** [https://eranra.github.io/ai-yard-guardian/](https://eranra.github.io/ai-yard-guardian/)

---

## ✨ Features

- **Zero Installation (PWA):** Runs entirely in Chrome or Samsung Internet. Add it to your home screen with one tap to use it like a native app.
- **🤖 Telegram Remote Control & Alerts:** Use Telegram as your remote control from anywhere in the world:
  - 🚨 **Instant Intruder Alerts:** Immediate push notifications whenever a target animal is detected.
  - 📸 **Detection Snapshots:** Automatically delivers a photo of the intruder directly to your chat.
  - 📡 **On-Demand Remote Commands:**
    - `/snap` — capture and send back a live photo from the garden phone right now.
    - `/spray` — remotely test or fire deterrent activations (sprinklers, siren, etc.).
    - `/arm` — start AI guardian monitoring remotely.
    - `/disarm` — pause AI monitoring into standby.
    - `/status` — check armed state, active targets, sensitivity, and clock.
- **📷 Dynamic Multi-Camera Lens Selection:** Automatically discovers all physical front and rear cameras/lenses (Main Wide, Ultra-Wide, Telephoto, Front) on any device (Samsung, Xiaomi, Pixel, etc.). Switch lenses anytime and your preference is saved permanently.
- **On-Device AI Vision:** Uses TensorFlow.js (`mobilenet_v2`) running directly on your phone's GPU/NPU.
- **🎯 Multi-Select Target Animals:** Choose exactly which animals trigger deterrents:
  - 🐱 Cat
  - 🐶 Dog
  - 🐦 Bird
  - 🦔 Porcupine
  - 🦌 Deer / Sheep
  - 🐮 Cow / Cattle
  - 🐴 Horse
  - 🐻 Bear
  - 🧸 Plush / Toy Animal
- **⚡ Extensible Deterrent Activations:** Select your preferred response actions:
  - 💦 **Sprinklers (Smart Life Webhook)** *(Default)*
  - 📸 **Save Screenshot (Incident Capture)** *(Default — captures & saves a single annotated timestamped photo per detection)*
  - 🔊 **Phone Siren / Audio Alarm**
  - ⚡ **Screen Strobe Alert**
- **🔒 Humans are Cutoff Only:** People strictly trigger the safety disarm / pause and cannot be selected as targets.
- **24/7 Keep-Alive:**
  - **Screen Wake Lock API:** Prevents your phone screen from dimming, locking, or sleeping.
  - **🌙 Black Screen Stealth Mode:** Turns the screen completely pitch-black while keeping the camera and AI running at full speed to eliminate device heating and OLED burn-in.
- **💾 Full Persistence:** All selections (targets, activations, sensitivity, camera, and webhook / Telegram credentials) are automatically saved to your phone's local storage.

---

## 🚀 Quick Start

1. Open **[https://eranra.github.io/ai-yard-guardian/](https://eranra.github.io/ai-yard-guardian/)** on your Android phone.
2. When prompted, tap **"Allow Camera"**.
3. Select your target animals and deterrent actions.
4. *(Recommended)* Set up Telegram Remote:
   - In the **Telegram Bot Remote Control** section, paste your Bot Token and Chat ID.
   - Check **"Send alerts & photos to Telegram"** and **"Accept Telegram commands (/snap, /spray, /arm, /disarm)"**.
5. Tap **"▶️ Start Guardian"**.
6. *(Optional)* Tap the browser menu (**⋮**) $\rightarrow$ **"Add to Home Screen"** to save it as an app icon.
7. Tap **"🌙 Black Screen"** for continuous 24/7 monitoring.

---

## 🤖 Telegram Bot Remote Setup

Setting up remote alerts and control via Telegram takes less than 2 minutes:

1. **Create Bot:** Message [@BotFather](https://t.me/BotFather) on Telegram and send `/newbot`. Follow the prompt to name your bot and copy the **HTTP API Token**.
2. **Get your Chat ID:** Send `/start` to [@userinfobot](https://t.me/userinfobot) or your new bot, and note your numeric ID.
3. **Configure in App:** Paste your Bot Token and Chat ID into the app's Telegram section, or open a pre-filled link:
   ```text
   https://eranra.github.io/ai-yard-guardian/?tg_token=YOUR_BOT_TOKEN&tg_chat=YOUR_CHAT_ID
   ```
4. **Test:** Send `/status` or `/snap` from your Telegram chat to verify two-way communication.

---

## 💧 Free Smart Life Webhook Setup (No IFTTT Pro Needed)

You do **NOT** need an IFTTT Pro subscription. You can connect Smart Life for 100% free using **SEQUEmatic** as a cloud webhook bridge:

1. Create a free account at **[sequematic.com](https://sequematic.com)** (100% free alternative to IFTTT).
2. Go to **Settings** $\rightarrow$ **Linked Services** $\rightarrow$ click **Link Tuya / Smart Life** and log in.
3. Tap **Create Sequence**:
   - **Trigger:** Webhook $\rightarrow$ Event name: `cat_detected`.
   - **Action:** Tuya / Smart Life $\rightarrow$ choose your scene (e.g. `sprinklers_burst`) or select valve $\rightarrow$ Turn ON $\rightarrow$ Pause 8s $\rightarrow$ Turn OFF.
4. Copy your sequence webhook URL:
   ```text
   https://sequematic.com/trigger-ifttt-webhook/YOUR_USER_ID/YOUR_SEQ_ID/cat_detected
   ```
5. Paste it into the app's **Smart Life Webhook URL** field. Completely free forever!

---

## 🔋 Recommended 24/7 Setup

1. Place your phone on a window sill or stand looking at the yard.
2. Keep it plugged into USB power.
3. In Android Developer Options, enable **"Stay awake while charging"**.
4. Tap **"🌙 Black Screen"** in the app to keep the phone cool and dark.
