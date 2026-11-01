#!/usr/bin/env python3
"""
monitor_events.py - Real-Time Event & Snapshot Monitor for AI Yard Guardian

Monitors incoming telemetry, auto-snapshots, and intruder alerts ingested
from the yard guardian phone. Supports:
  1. --summary [minutes]: Summarize snapshots and detections received in the last N minutes.
  2. --wait-alert [--timeout seconds]: Wait for an intruder alert or animal detection event.
     Exits immediately when an alert is detected, waking up the assistant session.
  3. --latest [count]: Display the most recent snapshot files and their metadata.
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime, timezone, timedelta

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "received_events")
JSONL_LOG = os.path.join(DATA_DIR, "events.jsonl")


def load_events(max_age_minutes=None):
    if not os.path.exists(JSONL_LOG):
        return []
    
    events = []
    cutoff_time = None
    if max_age_minutes is not None:
        cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=max_age_minutes)

    with open(JSONL_LOG, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
                # Check timestamp
                ts = ev.get("timestamp")
                if ts and cutoff_time:
                    ev_time = datetime.fromtimestamp(ts / 1000.0, timezone.utc)
                    if ev_time < cutoff_time:
                        continue
                events.append(ev)
            except Exception:
                continue
    return events


def print_summary(minutes=15):
    events = load_events(max_age_minutes=minutes)
    print(f"=== AI Yard Guardian Event Summary (Past {minutes} Minutes) ===")
    print(f"Current Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Total Events Ingested: {len(events)}")
    
    alerts = [e for e in events if e.get("type") == "alert"]
    snapshots = [e for e in events if e.get("type") == "snapshot"]
    messages = [e for e in events if e.get("type") == "message"]
    
    print(f"🚨 Alerts: {len(alerts)}")
    print(f"📸 Snapshots: {len(snapshots)}")
    print(f"💬 Telemetry Messages: {len(messages)}")
    print()

    if alerts:
        print("--- Active Alerts ---")
        for a in alerts:
            print(f"  • [{a.get('dateStr')}] {a.get('text')}")
        print()

    if snapshots:
        print("--- Recent Snapshots ---")
        for s in snapshots[-10:]:
            caption = (s.get("caption") or "").replace("\n", " ").strip()
            # Clean HTML tags for console
            import re
            clean_caption = re.sub(r"<[^>]+>", "", caption)
            print(f"  • [{s.get('dateStr')}] File: {s.get('filename')} | {clean_caption[:100]}")
        print()

    if not events:
        print("No new events recorded in this window.")


def wait_for_alert(timeout_seconds=900, poll_interval=1.0):
    """
    Tails events.jsonl from current EOF.
    Exits immediately if an alert or animal detection event is recorded.
    """
    print(f"[*] Starting alert watcher (timeout: {timeout_seconds}s, log: {JSONL_LOG})")
    
    # Seek to current end of file
    file_pos = 0
    if os.path.exists(JSONL_LOG):
        file_pos = os.path.getsize(JSONL_LOG)
    
    start_time = time.time()
    
    while True:
        elapsed = time.time() - start_time
        if timeout_seconds and elapsed >= timeout_seconds:
            print(f"[*] Alert watcher timed out after {int(elapsed)}s without alert.")
            sys.exit(0)
            
        if os.path.exists(JSONL_LOG):
            current_size = os.path.getsize(JSONL_LOG)
            if current_size > file_pos:
                with open(JSONL_LOG, "r", encoding="utf-8", errors="replace") as f:
                    f.seek(file_pos)
                    lines = f.readlines()
                    file_pos = f.tell()
                    
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        ev = json.loads(line)
                        ev_type = ev.get("type")
                        text = ev.get("text") or ""
                        caption = ev.get("caption") or ""
                        
                        # Check for alert or explicit target detection
                        is_alert = (ev_type == "alert") or ("INTRUDER" in text.upper()) or ("Intruder Alert" in caption)
                        is_animal_detection = False
                        metadata = ev.get("metadata") or {}
                        if metadata.get("target") in ["cat", "dog", "person"]:
                            is_animal_detection = True

                        if is_alert or is_animal_detection:
                            print("\n" + "="*50)
                            print("🚨 NEW DETECTION / ALERT DETECTED!")
                            print(f"Timestamp: {ev.get('dateStr')}")
                            print(f"Type: {ev_type}")
                            print(f"Details: {text or caption}")
                            if ev.get("filename"):
                                full_path = os.path.join(DATA_DIR, ev.get("filename"))
                                print(f"Snapshot Image: {full_path}")
                            print("="*50 + "\n")
                            # Exit 0 immediately to wake up the agent
                            sys.exit(0)
                    except Exception as err:
                        pass
                        
        time.sleep(poll_interval)


def print_latest(count=5):
    snapshots = [e for e in load_events() if e.get("type") == "snapshot"]
    print(f"=== Last {min(count, len(snapshots))} Snapshots ===")
    for s in snapshots[-count:]:
        filepath = os.path.join(DATA_DIR, s.get("filename", ""))
        print(f"File: {filepath}")
        print(f"Time: {s.get('dateStr')}")
        print(f"Caption: {s.get('caption')}")
        print("-" * 40)


def main():
    parser = argparse.ArgumentParser(description="Monitor AI Yard Guardian events")
    parser.add_argument("--summary", type=int, nargs="?", const=15, default=None,
                        help="Summarize events in the last N minutes (default 15)")
    parser.add_argument("--wait-alert", action="store_true",
                        help="Wait until an alert occurs and exit immediately")
    parser.add_argument("--timeout", type=int, default=900,
                        help="Timeout in seconds for --wait-alert (default 900)")
    parser.add_argument("--latest", type=int, default=0,
                        help="Display the latest N snapshot entries")
    args = parser.parse_args()

    if args.latest > 0:
        print_latest(args.latest)
    elif args.wait_alert:
        wait_for_alert(timeout_seconds=args.timeout)
    elif args.summary is not None:
        print_summary(minutes=args.summary)
    else:
        print_summary(minutes=15)


if __name__ == "__main__":
    main()
