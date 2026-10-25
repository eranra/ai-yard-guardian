# 🛡️ AI Yard Guardian (Web / PWA)

A zero-install, on-device AI yard monitoring and wildlife deterrent system that runs directly inside your phone's browser, connects to **Telegram** for remote monitoring and two-way control, and triggers your **Smart Life / Tuya** watering system.

🔗 **Live App:** [https://eranra.github.io/ai-yard-guardian/](https://eranra.github.io/ai-yard-guardian/)

---

## ✨ Features

- **Zero Installation (PWA):** Runs entirely in Chrome or Samsung Internet. Add it to your home screen with one tap to use it like a native app.
- **🤖 Telegram Remote Control, Live Touch Buttons & Full Configuration:**
  - 🔘 **Interactive Touch Buttons:** Persistent custom reply keyboard at the bottom of your chat:
    - `[ 📸 Snapshot ]` `[ 💦 Spray Test ]`
    - `[ 🛡️ Arm ]` `[ ⏸️ Disarm ]` `[ 🔦 Torch ]`
    - `[ 🌙 Screen ]` `[ 📊 Status ]` `[ ⚙️ Config ]` `[ 🔄 Refresh ]`
  - 🚨 **Instant Intruder Alerts:** Immediate push notifications whenever a target animal is detected.
  - 📸 **Smart Delta-Change Auto-Snapshots (v0.7.3):** Automatically transmits annotated photos to Telegram whenever detection state changes (new animal arrives, animal departs, count changes) with an independent detection threshold (default **5%**), sliding rate limiting (default max 5/min, 12s spacing), continuous **Per-Object 60m Sliding TTL Noise Learning** (learns static non-targets like chairs, benches, or plants and continuously refreshes their TTL while present so they never expire or cause hourly snapshot bursts; automatically prunes objects absent for >60 minutes), and zero spam during static scenes.
  - 📸 **Detection Snapshots:** Automatically delivers an upright photo of the intruder directly to your chat.
  - ⚙️ **Full Remote Configuration Management:**
    - `/config` — view full configuration readout including battery level, AI speed, screen saver timeout, rotation angle, auto-snapshot status, threshold & noise filter state, and lenses.
    - `/set autosnap <on|off|rate>` — enable, disable, or adjust rate cap for Delta Auto-Snapshots (e.g. `/set autosnap 5` or `/set autosnap off`).
    - `/set autosnap thresh <1-99>` — set independent detection threshold for auto-snapshots (default `5%`).
    - `/set autosnap noise <on|off|clear>` — toggle automatic noise object learning (60m sliding TTL) or clear current learned noise objects.
    - `/rotate [angle]` — rotate camera 90° clockwise (or set direct angle e.g. `/rotate 270`) and immediately send back a test snapshot.
    - `/set rotate <0|90|180|270>` — set exact camera rotation angle directly (e.g. `/set rotate 270` for sideways phones).
    - `/set speed <eco|balanced|turbo>` — set AI detection rate (Eco 3 FPS default, Balanced 5 FPS, Turbo Uncapped).
    - `/set screen <1|2|5|10|30s|off>` — set auto-blackout inactivity timeout (default `1` minute).
    - `/set day <1-99>` — set daytime sensitivity threshold (e.g. `/set day 15`).
    - `/set night <1-99>` — set nighttime sensitivity threshold (e.g. `/set night 5` or `1` for maximum detection).
    - `/set mode <auto|day|night>` — set light detection mode.
    - `/set targets <cat,dog,bird...>` — set target animal list.
    - `/set actions <sprinklers,screenshot,siren,strobe>` — set active deterrent actions.
    - `/set boost <1-6|off>` — set AI night shadow-lift level (1-Normal to 6-Moonlight Ultra, or off).
    - `/set exposure <on|off>` — toggle camera hardware EV boost.
    - `/set torch_assist <on|off>` — toggle flashlight assist on night alert.
    - `/set safety <on|off>` — toggle human safety pause cutoff.
    - `/set webhook <url>` — update Smart Life webhook URL.
    - `/target add <animal>` / `/target remove <animal>` — add/remove target.
    - `/action add <action>` / `/action remove <action>` — add/remove action.
    - `/camera list` and `/camera <number>` — switch physical camera lens remotely.
  - 📡 **Quick Commands:**
    - `/snap` — capture and send back a live photo from the garden phone right now with active AI object detection, bounding box overlay, timestamped banner, and detailed detection caption.
    - `/rotate [0|90|180|270]` — cycle camera rotation 90° (or set direct angle e.g. `/rotate 270`) and verify with an immediate AI-annotated snapshot.
    - `/spray` — remotely test or fire deterrent activations (sprinklers, siren, etc.).
    - `/arm` / `/disarm` — arm or pause AI monitoring into standby.
    - `/screen [on|off]` (or `/stealth`) — remotely activate or wake up the OLED blackout screen saver.
    - `/torch [on|off]` — remotely toggle phone flashlight/torch.
    - `/status` — check battery level (%, charging/discharging), screen state, AI speed, rotation, armed status, and ambient lighting.
    - `/refresh` — remotely clear browser cache and reload the application from GitHub Pages.
- **🔄 Complete 360° Camera Stream Rotation & Orientation Engine (v0.6.0):**
  - **The Problem Solved:** When phones are mounted horizontally on a window sill or stand, Android's hardware camera sensor outputs portrait pixels sideways relative to the horizon.
  - **The Solution:** Full hardware rotation transform (`0°`, `90°`, `180°`, `270°`) applied across the entire processing pipeline:
    - Rotates the live `<video>` viewport and aspect ratio seamlessly.
    - Rotates the offscreen AI canvas before feeding TensorFlow MobileNet, ensuring animals walking across the lawn are upright for maximum neural network recognition.
    - Rotates the bounding box annotation overlay in 1:1 coordinate alignment.
    - Produces perfectly upright Telegram snapshots (`/snap`) and intruder evidence photos.
    - Controllable via quick UI button `[ 🔄 Rotate ]`, Settings dropdown, or Telegram `/rotate [angle]` and `/set rotate <angle>` commands.
    - Full persistence across reloads/refresh for both camera rotation and shadow boost level.
- **🔋 Battery Life Reporting & Power Optimization:**
  - **🌱 AI Eco Processing Rate (CPU & Heat Reduction):** Caps deep neural net inference to ~3 FPS (~330ms intervals) by default (options: Eco 3 FPS, Balanced 5 FPS, Turbo Uncapped). Slashes continuous CPU/GPU load from 100% down to ~20%, keeping the phone cool and preventing Android/Xiaomi thermal charge throttling so your phone charges quickly to 100% while still catching every intruder.
  - **Live Battery Telemetry:** Real-time battery percentage and charging status tracked via the Battery Status API, reported on the top header badge, in `/status`, and in `/config`.
  - **Auto-OLED Screen Blackout:** Automatically transitions to full-screen pitch black (`#000000`) after inactivity (configurable: 30s, 1m default, 2m, 5m, 10m, or off).
  - **Why OLED Blackout vs. OS Lock Screen:** Modern phones (including Xiaomi) have AMOLED displays where black pixels turn completely off (0 nits), reducing display draw by ~90%. Crucially, this keeps the browser in the foreground so camera capture, WebGL TensorFlow AI detection, and Telegram commands continue running 24/7 without being stopped by Android OS sleep.
  - **One-Tap Wake:** Tap anywhere on the glass to instantly wake the control dashboard.
- **🌙 Auto Night Vision & Extreme Low-Light Enhancement Engine (v5.7):**
  - **Smart Ambient Luma Sensor:** Real-time luminance monitoring ($Y = 0.299R + 0.587G + 0.114B$) automatically switches between Day and Night modes with hysteresis.
  - **Dual Adaptive Sensitivity:** Separate customizable thresholds for Daytime (default `40%`) and Nighttime (default `25%`) to capture dark animal silhouettes without false daytime positives.
  - **🚀 Non-Linear Gamma Shadow-Lift Engine (6 Selectable Levels):** Mathematically expands deep shadows ($RGB < 35$) up into high-visibility range ($RGB\ 80-130$) without crushing dark tones to pure zero black:
    - Level 1: Normal
    - Level 2: High
    - Level 3: Ultra (Default)
    - Level 4: Max
    - Level 5: Extreme (Clean — with chromatic noise suppression)
    - Level 6: Moonlight Ultra (for near-zero ambient light)
  - **📷 Xiaomi / Android Hardware Sensor Boost:** Probes and configures maximum available camera hardware sensor sensitivity (`iso: max`, `exposureTime: max` / slow shutter integration, `exposureCompensation: +2.0 EV`, and continuous AE/AWB) via MediaStreamTrack ISP controls to maximize photon gathering without automatic flashlight.
  - **🔦 Flashlight / Torch Assist:** Manual remote `/torch` control or optional 5s alarm-triggered light to scare intruders and capture evidence photos. Continuous auto-flashlight is strictly disabled to prevent light disturbance.
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
