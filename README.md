# 🛡️ AI Yard Guardian (Web / PWA)

A zero-install, on-device AI yard monitoring and wildlife deterrent system that runs directly inside your phone's browser and triggers your **Smart Life / Tuya** watering system.

🔗 **Live App:** [https://eranra.github.io/ai-yard-guardian/](https://eranra.github.io/ai-yard-guardian/)

---

## ✨ Features

- **Zero Installation (PWA):** Runs entirely in Chrome or Samsung Internet. Add it to your home screen with one tap to use it like a native app.
- **On-Device AI Vision:** Uses TensorFlow.js (`mobilenet_v2`) running directly on your phone's GPU/NPU.
- **🎯 Multi-Select Target Animals:** Choose exactly which animals trigger deterrents:
  - 🐱 Cat
  - 🐶 Dog
  - 🐦 Bird
  - 🦌 Deer / Sheep
  - 🐮 Cow / Cattle
  - 🐴 Horse
  - 🐻 Bear
  - 🧸 Plush / Toy Animal
- **⚡ Extensible Deterrent Activations:** Select your preferred response actions via combo box:
  - 💦 **Sprinklers (Smart Life Webhook)** *(Default)*
  - 🔊 **Phone Siren / Audio Alarm**
  - ⚡ **Screen Strobe Alert**
- **🔒 Humans are Cutoff Only:** People strictly trigger the safety disarm / pause and cannot be selected as targets.
- **24/7 Keep-Alive:**
  - **Screen Wake Lock API:** Prevents your phone screen from dimming, locking, or sleeping.
  - **🌙 Black Screen Stealth Mode:** Turns the screen completely pitch-black while keeping the camera and AI running at full speed to eliminate device heating and OLED burn-in.
- **💾 Full Persistence:** All selections (targets, activations, sensitivity, toggles, and webhook URL) are automatically saved to your phone's local storage.

---

## 🚀 Quick Start

1. Open **[https://eranra.github.io/ai-yard-guardian/](https://eranra.github.io/ai-yard-guardian/)** on your Android phone.
2. When prompted, tap **"Allow Camera"**.
3. Select your target animals and deterrent actions.
4. Tap **"▶️ Start Guardian"**.
5. *(Optional)* Tap the browser menu (**⋮**) $\rightarrow$ **"Add to Home Screen"** to save it as an app icon.
6. Tap **"🌙 Black Screen"** for continuous 24/7 monitoring.

---

## 💧 Free Smart Life Webhook Setup (No IFTTT Pro Needed)

You do **NOT** need an IFTTT Pro subscription. You can connect Smart Life for 100% free using either of these two methods:

### Method 1: Local on Your Android Phone via MacroDroid (Recommended)
Because your Android phone is already running the camera, it can trigger Smart Life directly on the device!

1. In **Smart Life**, create a *Tap-to-Run* scene called **"Sprinkler Blast"** (Turn valve ON $\rightarrow$ Delay 8s $\rightarrow$ Turn OFF).
2. Install the free **[MacroDroid](https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid)** app from Google Play Store.
3. In MacroDroid, tap **Add Macro**:
   - **Trigger:** Connectivity $\rightarrow$ **Webhook (HTTP Request)** $\rightarrow$ Identifier: `cat_detected`.
   - **Action:** Apps $\rightarrow$ **Open Shortcuts** $\rightarrow$ **Smart Life** $\rightarrow$ select your `Sprinkler Blast` scene!
4. Save the macro. MacroDroid will show your unique free URL:
   ```text
   https://trigger.macrodroid.com/YOUR_DEVICE_ID/cat_detected
   ```
5. Paste this URL into the app's Webhook field. Done!

---

### Method 2: Free Cloud Bridge via SEQUEmatic (Zero Phone Setup)
If you prefer a pure cloud connection without installing any automation app on the phone:

1. Create a free account at **[sequematic.com](https://sequematic.com)** (100% free alternative to IFTTT).
2. Go to **Settings** $\rightarrow$ **Linked Services** $\rightarrow$ click **Link Tuya / Smart Life** and log in.
3. Tap **Create Sequence**:
   - **Trigger:** Custom Webhook $\rightarrow$ Event name: `cat_detected`.
   - **Action:** Tuya / Smart Life $\rightarrow$ choose your valve $\rightarrow$ Turn ON $\rightarrow$ Pause 8s $\rightarrow$ Turn OFF.
4. Copy your sequence webhook URL:
   ```text
   https://sequematic.com/trigger-custom-webhook/USER_ID/SECRET/cat_detected
   ```
5. Paste it into the app's Webhook field. Completely free forever.

---

## 🔋 Recommended 24/7 Setup

1. Place your phone on a window sill or stand looking at the yard.
2. Keep it plugged into USB power.
3. In Android Developer Options, enable **"Stay awake while charging"**.
4. Tap **"🌙 Black Screen"** in the app to keep the phone cool and dark.
