"""AI Yard Guardian - Main Detection Loop

Runs real-time animal detection on camera stream and triggers Smart Life watering.
Designed to run 24/7 on Android devices via Termux or Pydroid.
"""

import json
import logging
import os
import sys
import time
import urllib.request
import cv2
import numpy as np

from smart_life import SmartLifeController

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

# Standard COCO class names for YOLO / MobileNet models
COCO_CLASSES = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
    "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
    "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
    "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse",
    "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator",
    "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"
]


class Detector:
    def __init__(self, model_path="yolov8n.onnx"):
        self.backend = None
        self.model = None

        # 1. Try Ultralytics YOLO if installed
        try:
            from ultralytics import YOLO
            logging.info("Using Ultralytics YOLO backend.")
            self.model = YOLO("yolov8n.pt")
            self.backend = "ultralytics"
            return
        except Exception as e:
            logging.info("Ultralytics YOLO not found or unavailable (%s). Falling back to OpenCV DNN.", e)

        # 2. Fall back to OpenCV DNN
        if os.path.exists(model_path):
            logging.info("Loading OpenCV DNN model from %s...", model_path)
            self.net = cv2.dnn.readNet(model_path)
            self.backend = "opencv_dnn"
        else:
            logging.info("Downloading lightweight YOLOv8n ONNX model (~12MB)...")
            self._download_model(model_path)
            self.net = cv2.dnn.readNet(model_path)
            self.backend = "opencv_dnn"

    def _download_model(self, target_path):
        url = "https://github.com/ultralytics/assets/releases/download/v8.2.0/yolov8n.onnx"
        urllib.request.urlretrieve(url, target_path)
        logging.info("Model downloaded successfully to %s", target_path)

    def detect(self, frame, conf_threshold=0.55):
        """Returns a list of dicts: [{'label': str, 'conf': float, 'box': [x1, y1, x2, y2]}]"""
        if self.backend == "ultralytics":
            results = self.model(frame, verbose=False)
            detections = []
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    if conf >= conf_threshold and cls_id < len(COCO_CLASSES):
                        detections.append({
                            "label": COCO_CLASSES[cls_id],
                            "conf": conf,
                            "box": box.xyxy[0].tolist(),
                        })
            return detections

        elif self.backend == "opencv_dnn":
            h, w = frame.shape[:2]
            blob = cv2.dnn.blobFromImage(frame, 1/255.0, (640, 640), swapRB=True, crop=False)
            self.net.setInput(blob)
            outputs = self.net.forward()

            # YOLOv8 output shape is [1, 84, 8400]
            detections = []
            output = outputs[0]
            if output.shape[0] == 84 and output.shape[1] > 84:
                output = output.T  # Shape: [8400, 84]

            for row in output:
                classes_scores = row[4:]
                max_score_idx = np.argmax(classes_scores)
                max_score = classes_scores[max_score_idx]

                if max_score >= conf_threshold:
                    label = COCO_CLASSES[max_score_idx] if max_score_idx < len(COCO_CLASSES) else "unknown"
                    detections.append({
                        "label": label,
                        "conf": float(max_score),
                        "box": []
                    })
            return detections

        return []


def load_config(path="config.json"):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def fetch_frame(stream_url, timeout=3):
    """Fetches a single frame from the local IP Webcam stream."""
    req = urllib.request.Request(
        stream_url,
        headers={"User-Agent": "Mozilla/5.0 (Android; AI-Yard-Guardian)"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        img_array = np.asarray(bytearray(response.read()), dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        return frame


def main():
    config = load_config()
    cam_cfg = config.get("camera", {})
    det_cfg = config.get("detection", {})

    stream_url = cam_cfg.get("stream_url", "http://127.0.0.1:8080/shot.jpg")
    fetch_interval = cam_cfg.get("fetch_interval_seconds", 0.25)
    target_classes = set(det_cfg.get("target_classes", ["cat", "dog", "bird"]))
    safety_class = det_cfg.get("safety_class", "person")
    conf_thresh = det_cfg.get("confidence_threshold", 0.60)
    cooldown_seconds = det_cfg.get("cooldown_seconds", 45)

    controller = SmartLifeController()
    detector = Detector()

    logging.info("=" * 60)
    logging.info("🛡️  AI Yard Guardian Started Successfully")
    logging.info("📸 Camera Stream: %s", stream_url)
    logging.info("🎯 Targets to Deter: %s", list(target_classes))
    logging.info("👤 Safety Class: %s", safety_class)
    logging.info("⏳ Cooldown: %ss", cooldown_seconds)
    logging.info("=" * 60)

    last_trigger_time = 0

    while True:
        try:
            frame = fetch_frame(stream_url, timeout=cam_cfg.get("timeout_seconds", 3))
            if frame is None:
                logging.warning("Received empty frame from camera, retrying...")
                time.sleep(1)
                continue

            detections = detector.detect(frame, conf_threshold=conf_thresh)

            # Check for safety class (person) first
            human_present = any(d["label"] == safety_class for d in detections)
            if human_present:
                logging.info("👤 Human in frame! Safety hold active (deterrent disarmed).")
                time.sleep(fetch_interval)
                continue

            # Check for target intruder animals
            for d in detections:
                label = d["label"]
                conf = d["conf"]

                if label in target_classes:
                    now = time.time()
                    elapsed = now - last_trigger_time

                    if elapsed >= cooldown_seconds:
                        logging.info("🎯 Intruder Detected: %s (confidence: %.1f%%)", label.upper(), conf * 100)
                        controller.trigger(detected_label=label)
                        last_trigger_time = now
                        break
                    else:
                        logging.info("Intruder (%s) seen, but in cooldown (%.0fs left).", label, cooldown_seconds - elapsed)

            time.sleep(fetch_interval)

        except urllib.error.URLError:
            logging.warning("Cannot reach camera at %s. Is IP Webcam running? Waiting 3s...", stream_url)
            time.sleep(3)
        except KeyboardInterrupt:
            logging.info("Shutting down AI Yard Guardian.")
            break
        except Exception as e:
            logging.error("Unexpected error in loop: %s", e)
            time.sleep(2)


if __name__ == "__main__":
    main()
