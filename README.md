# 🛡️ AI Yard Guardian (Web / PWA)

A zero-install, on-device AI yard monitoring and wildlife deterrent system that runs directly inside your phone's browser and triggers your **Smart Life / Tuya** watering system.

🔗 **Live App:** [https://eranra.github.io/ai-yard-guardian/](https://eranra.github.io/ai-yard-guardian/)

---

## ✨ Features

- **Zero Installation (PWA):** Runs entirely in Chrome or Samsung Internet. Add it to your home screen with one tap to use it like a native app.
- **On-Device AI Vision:** Uses TensorFlow.js (`mobilenet_v2`) running directly on your phone's GPU/NPU to detect cats, dogs, birds, and other animals in real-time.
- **Human Safety Interlock:** Automatically pauses water triggers whenever a person is detected in frame.
- **24/7 Keep-Alive:**
  - **Screen Wake Lock API:** Prevents your phone screen from dimming, locking, or sleeping.
  - **🌙 Black Screen Stealth Mode:** Turns the screen completely pitch-black while keeping the camera and AI running at full speed to eliminate device heating and OLED burn-in.
- **Smart Life / Tuya Integration:** Sends instant webhooks to trigger existing garden sprinklers, valves, or alarms.

---

## 🚀 Quick Start

1. Open **[https://eranra.github.io/ai-yard-guardian/](https://eranra.github.io/ai-yard-guardian/)** on your Android phone.
2. When prompted, tap **"Allow Camera"**.
3. Tap **"▶️ Start Guardian"**.
4. *(Optional)* Tap the browser menu (**⋮**) $\rightarrow$ **"Add to Home Screen"** to save it as an app icon.
5. Tap **"🌙 Black Screen"** for continuous 24/7 monitoring.

---

## ⚙️ Configuration (Inside the App)

- **Sensitivity Threshold:** Slider to adjust detection confidence (default: 40%).
- **Human Safety Hold:** Toggle on/off pause behavior when people are present.
- **Test Mode:** Plays an alarm sound directly from your phone's speaker for testing (without spraying water).
- **Webhook URL:** Enter your Smart Life / IFTTT / Home Assistant webhook URL to activate real sprinklers.

---

## 🔋 Recommended 24/7 Setup

1. Place your phone on a window sill or stand looking at the yard.
2. Keep it plugged into USB power.
3. In Android Developer Options, enable **"Stay awake while charging"**.
4. Tap **"🌙 Black Screen"** in the app to keep the phone cool and dark.
