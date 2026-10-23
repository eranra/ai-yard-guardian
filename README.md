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

## 💧 How to Configure the Smart Life Webhook

Connecting the app to your real Smart Life water valve takes just 3 steps:

### Step 1: Create a Tap-to-Run Scene in Smart Life
1. Open the **Smart Life** app.
2. Go to **Scene** $\rightarrow$ Tap **"+"** $\rightarrow$ Select **"Launch Tap-to-Run"**.
3. Under *Task*: Select **Run the device** $\rightarrow$ choose your water valve $\rightarrow$ **Turn ON**.
4. Add another task: **Delay** $\rightarrow$ set to **8 seconds**.
5. Add final task: choose water valve $\rightarrow$ **Turn OFF**.
6. Save and name it **"Sprinkler Blast"**.

### Step 2: Connect Smart Life to IFTTT (Free Webhook)
1. Go to [ifttt.com](https://ifttt.com) (or the IFTTT app) and tap **Create**.
2. **If This:** Search for **Webhooks** $\rightarrow$ select *"Receive a web request"* $\rightarrow$ Event Name: `cat_detected`.
3. **Then That:** Search for **Smart Life** $\rightarrow$ select *"Activate Scene"* $\rightarrow$ choose `Sprinkler Blast`.
4. Tap **Finish**.

### Step 3: Paste the URL in the App
1. Go to [ifttt.com/maker_webhooks/settings](https://ifttt.com/maker_webhooks/settings) to copy your webhook key.
2. Your URL will be:
   ```text
   https://maker.ifttt.com/trigger/cat_detected/with/key/YOUR_KEY
   ```
3. Paste it into the **Smart Life Webhook URL** field in the app. The app automatically saves it to your phone's storage.

---

## 🔋 Recommended 24/7 Setup

1. Place your phone on a window sill or stand looking at the yard.
2. Keep it plugged into USB power.
3. In Android Developer Options, enable **"Stay awake while charging"**.
4. Tap **"🌙 Black Screen"** in the app to keep the phone cool and dark.
