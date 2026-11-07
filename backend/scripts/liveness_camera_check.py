#!/usr/bin/env python3
"""Check the liveness model on your webcam, on a development laptop.

Each face is scored in realtime and shown with the verdict at the model's shipped threshold
(default 0.50, the production threshold). Hold up a photo or a screen to test spoofs.

Keys: L = label the current face as LIVE, P = label it as SPOOF, Q = quit.
Labelled frames are counted, and the accuracy at the threshold is printed on quit.
With --log, each labelled frame is also appended to a CSV file.

Usage (from backend/):
  .venv/bin/python scripts/liveness_camera_check.py [--camera 0] [--log results.csv]
  .venv/bin/python scripts/liveness_camera_check.py --image path/to/face.jpg   (score one still image)
"""
import argparse
import csv
import sys
import time
from pathlib import Path

backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

import cv2  # noqa: E402

from app.services.ai_orchestrator import AIOrchestrator  # noqa: E402

WINDOW = "Liveness check (L = live, P = spoof, Q = quit)"


def score_frame(orchestrator: AIOrchestrator, frame_bgr):
    """Return (score, box) for the first face, or (None, None) when no face or no score."""
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    face, box = orchestrator._detect_and_crop_face(frame_rgb)
    if face is None:
        return None, None
    return orchestrator._run_liveness_inference(face), box


def verdict(score: float, threshold: float) -> str:
    return "LIVE" if score >= threshold else "SPOOF"


def draw(frame, score, box, threshold: float, fps: float, tally: dict) -> None:
    if box is not None:
        x, y, w, h = box
        colour = (0, 200, 0) if verdict(score, threshold) == "LIVE" else (0, 0, 255)
        cv2.rectangle(frame, (x, y), (x + w, y + h), colour, 2)
        cv2.putText(frame, f"{score:.4f} {verdict(score, threshold)}", (x, max(y - 10, 20)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, colour, 2)
    else:
        cv2.putText(frame, "No face", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 200, 255), 2)
    cv2.putText(frame, f"threshold {threshold:.4f}  fps {fps:.1f}", (10, frame.shape[0] - 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    cv2.putText(frame, f"labelled: {tally['total']}  correct: {tally['correct']}", (10, frame.shape[0] - 12),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)


def print_summary(tally: dict, threshold: float) -> None:
    total = tally["total"]
    if total == 0:
        print("No faces were labelled, so there is no accuracy to report.")
        return
    live_total = tally["live_as_live"] + tally["live_as_spoof"]
    spoof_total = tally["spoof_as_live"] + tally["spoof_as_spoof"]
    print(f"\nThreshold {threshold:.4f}. Labelled frames: {total}")
    print(f"Accuracy: {tally['correct'] / total:.3f}")
    if live_total:
        print(f"Real people rejected (FRR): {tally['live_as_spoof']}/{live_total} = {tally['live_as_spoof'] / live_total:.3f}")
    if spoof_total:
        print(f"Spoofs accepted (FAR): {tally['spoof_as_live']}/{spoof_total} = {tally['spoof_as_live'] / spoof_total:.3f}")


def record_label(tally: dict, label: str, score: float, threshold: float) -> None:
    predicted = verdict(score, threshold)
    tally["total"] += 1
    tally["correct"] += int(predicted == label)
    key = f"{label.lower()}_as_{predicted.lower()}"
    tally[key] += 1


def append_log(path: Path, score: float, threshold: float, label: str) -> None:
    is_new = not path.exists()
    with path.open("a", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        if is_new:
            writer.writerow(["time", "score", "threshold", "predicted", "label"])
        writer.writerow([time.strftime("%Y-%m-%d %H:%M:%S"), f"{score:.6f}", f"{threshold:.6f}",
                         verdict(score, threshold), label])


def run_still_image(orchestrator: AIOrchestrator, image_path: str, threshold: float) -> None:
    frame = cv2.imread(image_path)
    if frame is None:
        raise SystemExit(f"Could not read image: {image_path}")
    score, _ = score_frame(orchestrator, frame)
    if score is None:
        print("No face found, or the model did not run.")
        return
    print(f"score {score:.6f}  threshold {threshold:.6f}  verdict {verdict(score, threshold)}")


def run_camera(orchestrator: AIOrchestrator, args, threshold: float) -> None:
    capture = cv2.VideoCapture(args.camera)
    if not capture.isOpened():
        raise SystemExit(f"Could not open camera {args.camera}")
    log_path = Path(args.log) if args.log else None
    tally = {"total": 0, "correct": 0, "live_as_live": 0, "live_as_spoof": 0, "spoof_as_live": 0, "spoof_as_spoof": 0}
    last_score, last_box, last_time = None, None, time.perf_counter()
    fps = 0.0
    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                raise SystemExit("Camera stopped sending frames.")
            last_score, last_box = score_frame(orchestrator, frame)
            now = time.perf_counter()
            fps = 1.0 / max(now - last_time, 1e-6)
            last_time = now
            draw(frame, last_score if last_score is not None else 0.0, last_box, threshold, fps, tally)
            cv2.imshow(WINDOW, frame)
            key = cv2.waitKey(1) & 0xFF
            if key in (ord("q"), ord("Q")):
                break
            if key in (ord("l"), ord("L"), ord("p"), ord("P")) and last_score is not None:
                label = "LIVE" if key in (ord("l"), ord("L")) else "SPOOF"
                record_label(tally, label, last_score, threshold)
                if log_path:
                    append_log(log_path, last_score, threshold, label)
    finally:
        capture.release()
        cv2.destroyAllWindows()
        print_summary(tally, threshold)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--camera", type=int, default=0, help="webcam index (default 0)")
    parser.add_argument("--log", help="CSV file to append labelled frames to")
    parser.add_argument("--image", help="score one still image instead of using the camera")
    parser.add_argument("--threshold", type=float, default=0.50, help="pass threshold (default 0.50)")
    args = parser.parse_args()

    threshold = args.threshold
    orchestrator = AIOrchestrator()
    if args.image:
        run_still_image(orchestrator, args.image, threshold)
    else:
        run_camera(orchestrator, args, threshold)


if __name__ == "__main__":
    main()
