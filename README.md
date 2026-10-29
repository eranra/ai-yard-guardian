# 🛡️ AI Yard Guardian (Web / PWA)

A zero-install, on-device AI yard monitoring and wildlife deterrent system that runs directly inside your phone's browser, connects to **Telegram** for remote monitoring and two-way control, and triggers your **Smart Life / Tuya** watering system.

🔗 **Live App:** [https://eranra.github.io/ai-yard-guardian/](https://eranra.github.io/ai-yard-guardian/)

---

## ✨ Features

- **Zero Installation (PWA):** Runs entirely in Chrome or Samsung Internet. Add it to your home screen with one tap to use it like a native app.
- **🐾 Motion-Guided High-Res Feline & Animal Detection Engine (v0.9.0 / v0.9.5):**
  - **The Problem Solved:** Standard COCO-SSD downsamples full-resolution video to 300×300 pixels. A cat 15 meters away on the lawn becomes an unrecognizable 8×6 pixel blob, while outdoor fairy lights blur into false alarms (e.g. `tv (34%)`).
  - **Sub-Millisecond Motion-Guided ROI Zoom:** High-speed background subtraction on an 80×60 grid detects moving clusters in <0.2ms—100,000× lighter computationally than running full neural models, saving battery and keeping phone temperatures cold.
  - **Deep ImageNet Animal Classification:** Moving regions are cropped at 1:1 sensor resolution (224×224) and classified using MobileNet v2 (`alpha: 0.75`), accurately identifying 12+ feline categories (`tabby`, `tiger cat`, `persian`, `siamese`, `lynx`, etc.), 120 dog breeds, birds, and wildlife with 80–98% confidence.
  - **Tuxedo & Domestic Cat Disambiguation (v0.9.4):** ImageNet has 120+ dog breeds but lacks a specific "tuxedo cat" class, causing domestic black-and-white cats to be misclassified as `Border collie` or `Boston bull` due to their piebald markings (black body, white bib & white socks). v0.9.4 introduces intelligent quadruped scale heuristics and domestic cat proxy mapping, correctly identifying and promoting black-and-white cats as `🎯 Cat (Tuxedo)`.
  - **Cumulative Target Animal Probability (v0.9.4):** In dim dawn or night conditions, neural probabilities can disperse across multiple animal categories (e.g., 8% collie, 6% cat, 5% domestic quadruped). The engine evaluates cumulative animal target probability ($\ge 12\%$) and low-light motion candidate scores ($\ge 6\%$) so faint animal intruders are never missed.
  - **📐 Physical Scale & Perspective Geometry Filter (v0.9.5):** Eliminates giant false detections caused by low-angle shadows across trees and walls. Enforces physical animal scale limits (domestic yard animals cannot exceed 28% of the camera frame, or >38% width in the upper yard background). An 800px wide tree shadow is rejected before it can trigger an alarm.
  - **🛡️ Static Scenery Anti-Hallucination Gate (v0.9.5):** Solves false detections on stationary trees, garden walls, and shadows. Any static candidate with low confidence (<50%) that has NO verified motion is strictly rejected unless the high-resolution deep classifier confirms it as a real target animal.
  - **Stationary Animal Persistence Tracking:** Solves the *"cat walked into the yard and stopped in the grass"* problem. Once an animal is detected, the engine maintains target tracking for up to 35 seconds after motion stops, re-evaluating every 5 frames so resting cats are never lost.
  - **Inanimate Noise Rejection:** Static ambiguous objects with low confidence (<50%) are inspected at full resolution; objects identified as lamps, flowerpots, folding chairs, or fairy lights are automatically suppressed, eliminating false alarms.
  - **⚡ Motion-Triggered Auto-Capture for Unconfirmed Movements (v0.9.3 - Default ON):** Automatically captures full yard photos and **1:1 zoomed crops** of any moving creature detected in the yard, even if the neural model was uncertain or classified it as an unconfirmed animal (e.g. `hare`, `weasel`, `badger`). Telegram delivery includes top 3 AI candidate guesses for instant visual verification and zero missed animals! Rate-limited (15s spacing). Configurable via `/set autosnap motion on|off`.
- **🤖 Telegram Remote Control, Live Touch Buttons & Full Configuration:**
  - 🔘 **Interactive Touch Buttons:** Persistent custom reply keyboard at the bottom of your chat:
    - `[ 📸 Snapshot ]` `[ 💦 Spray Test ]`
    - `[ 🛡️ Arm ]` `[ ⏸️ Disarm ]` `[ 🔦 Torch ]`
    - `[ 🌙 Screen ]` `[ 📊 Status ]` `[ ⚙️ Config ]` `[ 🔄 Refresh ]`
  - 🚨 **Instant Intruder Alerts:** Immediate push notifications whenever a target animal is detected.
  - 📸 **Smart Delta-Change Auto-Snapshots (v0.7.5):** Automatically transmits annotated photos to Telegram whenever detection state changes (new animal arrives, animal departs, count changes) with an independent detection threshold (default **5%**), sliding rate limiting (default max 5/min, 12s spacing), continuous **Per-Object 60m Sliding TTL Noise Learning** (learns static non-targets like chairs, benches, or plants and continuously refreshes their TTL while present so they never expire or cause hourly snapshot bursts; automatically prunes objects absent for >60 minutes), human safety threshold alignment (eliminating low-confidence shadow person events), snapshot noise absorption, and zero spam during static scenes.
  - 📸 **Detection Snapshots:** Automatically delivers an upright photo of the intruder directly to your chat.
  - ⚙️ **Full Remote Configuration Management:**
    - `/config` — view full configuration readout including battery level, AI speed, screen saver timeout, rotation angle, auto-snapshot status, threshold & noise filter state, and lenses.
    - `/autosnap <on|off|rate>` or `/set autosnap <on|off|rate>` — enable, disable, or adjust rate cap for Delta Auto-Snapshots (e.g. `/autosnap 5` or `/autosnap off`).
    - `/autosnap thresh <1-99>` or `/set autosnap thresh <1-99>` — set independent detection threshold for auto-snapshots (e.g. `/autosnap thresh 1`).
    - `/set autosnap noise <on|off|clear>` — toggle automatic noise object learning (60m sliding TTL) or clear current learned noise objects.
    - `/rotate [angle]` — rotate camera 90° clockwise (or set direct angle e.g. `/rotate 270`) and immediately send back a test snapshot.
    - `/set rotate <0|90|180|270>` — set exact camera rotation angle directly (e.g. `/set rotate 270` for sideways phones).
    - `/res <vga|720p|1080p|max>` or `/set res <vga|720p|1080p|max>` — set camera stream resolution (VGA 640×480, 720p HD, 1080p Full HD default, or Max 4K/sensor hardware maximum).
    - `/camfps <5|10|15|30>` or `/set camfps <5|10|15|30>` — set camera hardware sensor stream frame rate (5 Ultra-Cold, 10 FPS Recommended default, 15 Smooth, 30 Standard).
    - `/scanner <horizon|2zone|off>` or `/set scanner <horizon|2zone|off>` — configure Deep Yard Scanner (Horizon Far Lawn default, 2-Zone Left/Right, or Off).
    - `/set scanner snap <both|full|crop>` — configure snapshot detail mode (Dual Full + Magnified Zoom Crop default, Full only, or Zoom only).
    - `/speed <eco|eco-fast|balanced|turbo>` or `/set speed <eco|eco-fast|balanced|turbo>` — set AI detection rate (Eco 1 FPS Ultra Low Power, Eco-Fast 3 FPS Smooth, Balanced 5 FPS, Turbo Uncapped).
    - `/set screen <1|2|5|10|30s|off>` — set auto-blackout inactivity timeout (default `1` minute).
    - `/set day <1-99>` — set daytime sensitivity threshold (e.g. `/set day 10`).
    - `/set night <1-99>` — set nighttime sensitivity threshold (e.g. `/set night 10` for maximum animal detection).
    - `/set human <1-99>` — set independent human safety cutoff threshold (default `50%`, prevents faint night lights and reflections from triggering false human pauses when animal sensitivity is set ultra-sensitive at 10%).
    - `/set mode <auto|day|night>` — set light detection mode.
    - `/set targets <cat,dog,bird...>` — set target animal list.
    - `/set actions <sprinklers,screenshot,siren,strobe>` — set active deterrent actions.
    - `/set boost <1-6|off>` — set AI night shadow-lift level (1-Normal to 6-Moonlight Ultra, or off).
    - `/autotune [on|off]` or `/set autotune <on|off>` — Autonomous Night Vision Auto-Tuner (dynamically auto-balances EV and shadow-lift to prevent whiteout and darkness).
    - `/set exposure <on|off>` — toggle camera hardware EV boost.
    - `/set longexp <low|medium|high|off>` — set manual night exposure mode (low +0.4 EV, medium +1.0 EV, high +1.6 EV, or off 0.0 EV). Auto-balancing is handled by `/autotune`.
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
    - `/exposure` (or `/camera exp`) — inspect live camera sensor hardware exposure capabilities (EV range, ISO range, exposureTime, shutter mode).
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
  - **🌱 AI Eco Processing Rate (CPU & Heat Reduction):** Configurable inference speeds: **Eco Mode (1 FPS / 1000ms)** drops CPU/GPU usage to near zero so the phone stays cold and charges at maximum wattage; **Eco-Fast (3 FPS / 330ms)** maintains smooth animal tracking with ~75% energy savings; **Balanced (5 FPS)**; and **Turbo (Uncapped)**.
  - **📷 Camera Stream Resolution Setting (v0.7.6):** Select stream resolution between `vga` (640×480 - Cold), `720p` (1280×720 - HD), `1080p` (1920×1080 - Full HD Default), and `max` (3840×2160 / 4K / Sensor Max) via UI dropdown or `/set res <vga|720p|1080p|max>`. Higher resolutions produce ultra-sharp Telegram auto-snapshots while MobileNet efficiently downscales for fast inference.
  - **⚡ Camera Hardware Sensor Frame Rate Control (v0.7.9):** Eliminates camera sensor/ISP overheating by instructing Android's hardware camera pipeline to clock down from 30 FPS to **10 FPS** (recommended default) or **5 FPS** (ultra-cold saver) via `frameRate` constraints. Cuts hardware pixel throughput by 70% to 85% ($250\text{M} \rightarrow 40\text{M}$ pixels/sec in 4K), keeping the phone ice-cold 24/7 even in 4K or 1080p. Configurable via UI or `/set camfps <5|10|15|30>`.
  - **🔍 Deep Yard Scanner & Dual-Photo Delivery (v0.7.7):**
    - **Macro-Zoning AI Passes:** Solves small object detection for distant animals (cats, hedgehogs, birds across the lawn) without requiring 90 tiny tiles. In `horizon` mode (default), evaluates the full view alongside the top 65% distant perimeter band (1.54× pixel magnification); in `2zone` mode, scans Left and Right overlapping zones (1.67× magnification).
    - **IoU Prediction Fusion:** Merges full-frame and zoomed-zone predictions using Non-Maximum Suppression (IoU > 0.35) so there is zero temporal flickering or duplicate boxes.
    - **🖼️ Dual-Photo Delivery:** When an animal is detected, Telegram automatically receives **both** the full context photo (showing where the animal is on the property) and an immediate magnified high-resolution detail crop (showing the animal up close). Configurable via `/set scanner snap both|full|crop`.
  - **Live Battery Telemetry:** Real-time battery percentage and charging status tracked via the Battery Status API, reported on the top header badge, in `/status`, and in `/config`.
  - **Auto-OLED Screen Blackout:** Automatically transitions to full-screen pitch black (`#000000`) after inactivity (configurable: 30s, 1m default, 2m, 5m, 10m, or off).
  - **Why OLED Blackout vs. OS Lock Screen:** Modern phones (including Xiaomi) have AMOLED displays where black pixels turn completely off (0 nits), reducing display draw by ~90%. Crucially, this keeps the browser in the foreground so camera capture, WebGL TensorFlow AI detection, and Telegram commands continue running 24/7 without being stopped by Android OS sleep.
  - **One-Tap Wake:** Tap anywhere on the glass to instantly wake the control dashboard.
- **🌙 Auto Night Vision & Stationary-Yard Auto-Tuner Engine (v0.8.5):**
  - **✨ Stationary-Yard Autonomous Auto-Tuner (Default):** Specifically engineered for fixed-location yard cameras. Uses percentile distribution ($P10, P25, P50, P75, P95$) of 768 spatial scene pixels rather than naive global averaging. Isolates static point light fixtures (like garden solar lamps or porch bulbs) so they do NOT trick the camera into darkening the lawn into pitch black. Differentiates genuine broad whiteout from specular highlights, balances hardware sensor EV and shadow-lift, and locks into steady-state ($60 \le P50 \le 90$) with zero hunting or stream flickering. Configurable via UI toggle or `/autotune [on|off]` (configurable parameter, keeping Telegram keyboard uncluttered).
  - **Clean Hierarchical Controls (No Redundant Auto Modes):** Overarching Auto-Tuner handles all dynamic optimization. When manual override is desired, controls are strictly manual (`longexp` offers `low`, `medium`, `high`, `off`; `boost` offers Levels 1–6) without confusing secondary auto modes.
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
  - **🌙 Granular Night Exposure & Auto-Regulated Shutter (v0.8.3):** Eliminates whiteout/over-exposure while maintaining dark scene clarity. Features closed-loop Auto-Regulation (`auto` default) that dynamically monitors scene luminance and modulates exposure compensation between $0.0$ and $+1.3$ EV with continuous auto-exposure (AE). User configurable in high granularity (`auto`, `low` +0.4 EV, `medium` +1.0 EV, `high` +1.6 EV, or `off`). Day mode remains unchanged. Configurable via UI dropdown or `/set longexp <auto|low|medium|high|off>`.
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
- **🔒 Humans are Cutoff Only with Independent Threshold (v0.8.1):** People strictly trigger the safety disarm / pause and cannot be selected as targets. Human detection has its own dedicated confidence threshold (`50%` default, configurable via `/set human <%>` or UI slider), completely decoupled from animal sensitivity. This allows keeping animal sensitivity ultra-sensitive (e.g. `10%`) for distant cats and wildlife without low-light garden lights or reflections triggering false Human alerts.
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
