#!/usr/bin/env python3
"""
AI Hardware Acceleration Diagnostic & Benchmark Tool
Checks GPU (CUDA) and CPU device detection, dynamic memory growth, and inference health.
"""

import os
import sys
import time

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.hardware import hardware_manager


def run_diagnostics() -> bool:
    print("=" * 60)
    print("AI HARDWARE ACCELERATION DIAGNOSTICS")
    print("=" * 60)

    status = hardware_manager.initialize()

    print(f"• Configured Target  : {status['target_device']}")
    print(f"• Active Device      : {status['active_device']}")
    print(f"• Device Type        : {status['device_type']}")
    print(f"• Physical GPUs      : {status['gpus_detected'] or 'None detected'}")
    print(f"• Memory Growth      : {'Enabled' if status['memory_growth_enabled'] else 'Disabled / N/A'}")
    print(f"• Memory Limit (MB)  : {status['memory_limit_mb'] or 'None (dynamic growth)'}")
    print(f"• Fallback Triggered : {status['fallback_occurred']}")

    if status["fallback_reason"]:
        print(f"• Fallback Reason    : {status['fallback_reason']}")

    print("\n" + "-" * 60)
    print("RUNNING TENSOR BENCHMARK")
    print("-" * 60)

    try:
        import tensorflow as tf

        start_time = time.perf_counter()
        size = 2000
        tensor_a = tf.random.normal([size, size], dtype=tf.float32)
        tensor_b = tf.random.normal([size, size], dtype=tf.float32)
        result = tf.matmul(tensor_a, tensor_b)
        # Force execution
        _ = result[0, 0].numpy()
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

        print(f"✅ Matrix multiplication ({size}x{size}) completed in {duration_ms} ms")
        print(f"✅ Device used: {result.device}")
    except Exception as exc:
        print(f"❌ Tensor benchmark failed: {exc}")
        return False

    print("\n" + "-" * 60)
    print("VERIFYING OPENCV & DEEPFACE INTEGRITY")
    print("-" * 60)

    try:
        import cv2
        import numpy as np

        dummy_img = np.zeros((224, 224, 3), dtype=np.uint8)
        resized = cv2.resize(dummy_img, (112, 112))
        print(f"✅ OpenCV working properly (resize test: {resized.shape})")
    except Exception as exc:
        print(f"❌ OpenCV verification failed: {exc}")
        return False

    try:
        from deepface import DeepFace

        print(f"✅ DeepFace imported successfully (module: {DeepFace.__name__})")
    except Exception as exc:
        print(f"❌ DeepFace import failed: {exc}")
        return False

    print("\n" + "=" * 60)
    print(f"🎉 AI HARDWARE SUBSYSTEM IS FULLY OPERATIONAL ({status['device_type']} MODE)")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = run_diagnostics()
    sys.exit(0 if success else 1)
