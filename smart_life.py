"""Smart Life / Tuya water valve controller interface."""

import json
import logging
import sys
import threading
import time

try:
    import requests
except ImportError:
    requests = None

try:
    import tinytuya
except ImportError:
    tinytuya = None

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)


class SmartLifeController:
    def __init__(self, config_path="config.json"):
        with open(config_path, "r", encoding="utf-8") as f:
            self.full_config = json.load(f)

        self.config = self.full_config.get("smart_life", {})
        self.mode = self.config.get("mode", "test").lower()
        self.duration = self.full_config.get("detection", {}).get("watering_duration_seconds", 8)
        self.is_watering = False
        self._lock = threading.Lock()

        logging.info("SmartLifeController initialized in '%s' mode.", self.mode)

    def trigger(self, detected_label="animal"):
        """Trigger the watering system asynchronously to not block video detection."""
        with self._lock:
            if self.is_watering:
                logging.info("Watering is already in progress, skipping duplicate trigger.")
                return

            self.is_watering = True

        thread = threading.Thread(target=self._execute_trigger, args=(detected_label,), daemon=True)
        thread.start()

    def _execute_trigger(self, detected_label):
        try:
            if self.mode == "test":
                self._run_test_mode(detected_label)
            elif self.mode == "webhook":
                self._run_webhook_mode(detected_label)
            elif self.mode == "tinytuya":
                self._run_tinytuya_mode()
            else:
                logging.warning("Unknown smart_life mode '%s'. Running test mode.", self.mode)
                self._run_test_mode(detected_label)
        except Exception as e:
            logging.error("Failed to execute watering trigger: %s", e)
        finally:
            with self._lock:
                self.is_watering = False

    def _run_test_mode(self, detected_label):
        logging.info("=" * 50)
        logging.info("🚨 [TEST MODE TRIGGERED] Target: %s", detected_label.upper())
        logging.info("💦 Sprinklers ACTIVATED for %s seconds!", self.duration)
        logging.info("=" * 50)

        # Print audible bell character to terminal
        print("\a", end="", flush=True)

        # Simulate watering duration
        time.sleep(self.duration)
        logging.info("✅ [TEST MODE] Sprinklers DEACTIVATED.")

    def _run_webhook_mode(self, detected_label):
        url = self.config.get("webhook_url")
        if not url or "YOUR_KEY" in url:
            logging.error("Webhook URL is not configured in config.json!")
            return

        logging.info("Sending Webhook POST request to Smart Life: %s", url)
        if requests is None:
            logging.error("requests package is missing. Run 'pip install requests'.")
            return

        payload = {"value1": detected_label, "value2": f"{self.duration}s"}
        resp = requests.post(url, json=payload, timeout=5)
        logging.info("Webhook responded: %s %s", resp.status_code, resp.text[:100])

    def _run_tinytuya_mode(self):
        if tinytuya is None:
            logging.error("tinytuya package is missing. Run 'pip install tinytuya'.")
            return

        tuya_cfg = self.config.get("tinytuya", {})
        dev_id = tuya_cfg.get("device_id")
        dev_ip = tuya_cfg.get("device_ip")
        key = tuya_cfg.get("local_key")
        version = tuya_cfg.get("version", 3.3)

        logging.info("Connecting locally to Tuya valve at %s...", dev_ip)
        valve = tinytuya.OutletDevice(dev_id, dev_ip, key, version=version)
        valve.set_socketPersistent(True)

        logging.info("Opening water valve for %s seconds...", self.duration)
        valve.turn_on()
        time.sleep(self.duration)
        logging.info("Closing water valve...")
        valve.turn_off()
        logging.info("Valve closed.")
