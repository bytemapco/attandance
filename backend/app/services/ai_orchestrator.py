from __future__ import annotations

import asyncio
import os
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
from deepface import DeepFace
from tensorflow.keras.applications.mobilenet import preprocess_input

from app.core.hardware import hardware_manager
from app.core.logging_config import get_logger
from app.services.ai_models import (
    _background_lock,
    _deepface_lock,
    _liveness_lock,
    get_background_model,
    get_liveness_model,
)

logger = get_logger("app.ai.orchestrator")


class AIOrchestrator:
    """Orchestrates biometric facial verification and spoof checks across GPU/CPU."""

    def __init__(self) -> None:
        # Ensure hardware acceleration is initialized
        hardware_manager.initialize()

    def _detect_and_crop_face(
        self, img: np.ndarray
    ) -> Tuple[Optional[np.ndarray], Optional[Tuple[int, int, int, int]]]:
        try:
            with _deepface_lock:
                faces = DeepFace.extract_faces(img_path=img, detector_backend="opencv", enforce_detection=True)
            if not faces:
                return None, None
            fa = faces[0]["facial_area"]
            x, y, w, h = fa["x"], fa["y"], fa["w"], fa["h"]
            return img[y : y + h, x : x + w], (x, y, w, h)
        except Exception as exc:
            logger.warning("DeepFace face extraction failed: %s", exc)
            return None, None

    @staticmethod
    def _preprocess_liveness(face_crop: np.ndarray) -> np.ndarray:
        return np.expand_dims((cv2.resize(face_crop, (224, 224)).astype(np.float32) / 127.5) - 1.0, axis=0)

    @staticmethod
    def _preprocess_background(img: np.ndarray) -> np.ndarray:
        return preprocess_input(np.expand_dims(cv2.resize(img, (224, 224)), axis=0).astype(np.float32))

    def _run_face_comparison(self, stored_embedding: List[float], live_img: np.ndarray) -> float:
        if not stored_embedding or live_img is None:
            return 0.0
        try:
            with _deepface_lock:
                results = DeepFace.represent(img_path=live_img, model_name="Facenet", enforce_detection=False)
            if not results:
                return 0.0
            vec_s = np.array(stored_embedding, dtype=np.float32)
            vec_l = np.array(results[0]["embedding"], dtype=np.float32)
            norm_s, norm_l = np.linalg.norm(vec_s), np.linalg.norm(vec_l)
            if norm_s == 0.0 or norm_l == 0.0:
                return 0.0
            return max(0.0, min(1.0, float(np.dot(vec_s, vec_l) / (norm_s * norm_l))))
        except Exception as exc:
            logger.error("DeepFace face comparison failed safely: %s", exc, exc_info=True)
            return 0.0

    def _run_liveness_inference(self, face_crop: np.ndarray) -> float:
        if face_crop is None:
            return 0.0
        model = get_liveness_model()
        if model is None:
            return 0.0
        with _liveness_lock:
            processed = self._preprocess_liveness(cv2.cvtColor(face_crop, cv2.COLOR_RGB2BGR))
            return float(model.predict(processed, verbose=0)[0][0])

    def _run_background_inference(self, img: np.ndarray) -> float:
        if img is None:
            return 0.0
        model = get_background_model()
        if model is None:
            return 0.0
        with _background_lock:
            return float(model.predict(self._preprocess_background(img), verbose=0)[0][0])

    def _load_image_array(self, image_input: str | bytes) -> Optional[np.ndarray]:
        if isinstance(image_input, bytes):
            return cv2.imdecode(np.frombuffer(image_input, np.uint8), cv2.IMREAD_COLOR)
        if not image_input:
            return None
        if os.path.exists(image_input):
            return cv2.imread(image_input)
        try:
            from app.services.s3_service import s3_service

            raw_bytes = s3_service.download_bytes(image_input)
            return cv2.imdecode(np.frombuffer(raw_bytes, np.uint8), cv2.IMREAD_COLOR)
        except Exception as exc:
            logger.warning("Failed to load image from S3 '%s': %s", image_input, exc)
            return None

    def _run_embedding_extraction(self, image_input: str | bytes) -> List[float]:
        try:
            img = self._load_image_array(image_input)
            if img is None:
                return []
            with _deepface_lock:
                results = DeepFace.represent(
                    img_path=cv2.cvtColor(img, cv2.COLOR_BGR2RGB),
                    model_name="Facenet",
                    enforce_detection=True,
                )
            return [float(v) for v in results[0]["embedding"]] if results else []
        except Exception as exc:
            logger.error("DeepFace face embedding extraction failed safely: %s", exc, exc_info=True)
            return []

    async def extract_face_embedding(self, image_input: str | bytes) -> List[float]:
        try:
            return await asyncio.to_thread(self._run_embedding_extraction, image_input)
        except Exception as exc:
            logger.error("Face embedding extraction thread run failed: %s", exc, exc_info=True)
            return []

    async def analyze_attendance(self, image_input: str | bytes, face_embedding: List[float]) -> Dict[str, float]:
        def _load_and_crop():
            img = self._load_image_array(image_input)
            if img is None:
                return None, None
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            face_crop, _ = self._detect_and_crop_face(img_rgb)
            return img_rgb, face_crop

        try:
            img_rgb, face_crop = await asyncio.to_thread(_load_and_crop)
        except Exception as exc:
            logger.error("Failed to load and crop image: %s", exc, exc_info=True)
            return {"face_score": 0.0, "liveness_score": 0.0, "background_score": 0.0}

        if img_rgb is None:
            return {"face_score": 0.0, "liveness_score": 0.0, "background_score": 0.0}

        try:
            face_score, liveness_score, bg_score = await asyncio.gather(
                asyncio.to_thread(self._run_face_comparison, face_embedding, img_rgb),
                asyncio.to_thread(self._run_liveness_inference, face_crop),
                asyncio.to_thread(self._run_background_inference, img_rgb),
            )
            return {"face_score": face_score, "liveness_score": liveness_score, "background_score": bg_score}
        except Exception as exc:
            logger.error("Concurrent AI inference failed: %s", exc, exc_info=True)
            return {"face_score": 0.0, "liveness_score": 0.0, "background_score": 0.0}
