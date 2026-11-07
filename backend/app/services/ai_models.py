import os
import shutil
import threading
from typing import Optional
from app.core.logging_config import get_logger

logger = get_logger("app.ai.models")

BASE_MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models"))
LIVENESS_REPO = "prathamrajbhar/smart-attendance-liveness-detection"
BACKGROUND_REPO = "prathamrajbhar/smart-attendance-background-validation"
LIVENESS_FILENAME = "liveness_mobilenetv2_final.keras"
BACKGROUND_FILENAME = "background_mobilenet_v1.h5"

LIVENESS_MODEL_PATH = os.path.join(BASE_MODELS_DIR, "liveness_detection", LIVENESS_FILENAME)
BACKGROUND_MODEL_PATH = os.path.join(BASE_MODELS_DIR, "background_validation", "background_mobilenet_v1.h5")

_liveness_lock = threading.Lock()
_background_lock = threading.Lock()
_deepface_lock = threading.Lock()

_liveness_model: Optional[object] = None
_background_model: Optional[object] = None


def ensure_model_downloaded(repo_id: str, filename: str, local_path: str) -> str:
    if os.path.exists(local_path):
        return local_path
    logger.info("Downloading model: %s/%s", repo_id, filename)
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    try:
        from huggingface_hub import hf_hub_download

        downloaded = hf_hub_download(repo_id=repo_id, filename=filename, token=os.environ.get("HF_TOKEN"))
        shutil.copy(downloaded, local_path)
        return local_path
    except Exception as exc:
        logger.error("Failed to download model from Hugging Face: %s", exc, exc_info=True)
        raise RuntimeError(f"Could not load model {filename} from {repo_id}: {exc}") from exc


def load_liveness_model(model_path: str) -> Optional[object]:
    # The .keras file is saved by Keras 3. tf.keras is Keras 2 here (TF_USE_LEGACY_KERAS is set for DeepFace), so use keras directly.
    try:
        import keras

        return keras.models.load_model(model_path, compile=False)
    except Exception as exc:
        logger.warning("Could not load liveness model: %s", exc)
        return None


def get_liveness_model() -> Optional[object]:
    global _liveness_model
    if _liveness_model is not None:
        return _liveness_model
    try:
        final_path = ensure_model_downloaded(LIVENESS_REPO, LIVENESS_FILENAME, LIVENESS_MODEL_PATH)
        _liveness_model = load_liveness_model(final_path)
    except Exception as exc:
        logger.warning("Liveness model initialization failed: %s", exc)
    return _liveness_model


def get_background_model() -> Optional[object]:
    global _background_model
    if _background_model is not None:
        return _background_model
    try:
        final_path = ensure_model_downloaded(BACKGROUND_REPO, BACKGROUND_FILENAME, BACKGROUND_MODEL_PATH)
        try:
            import tf_keras as keras

            _background_model = keras.models.load_model(final_path, compile=False)
        except Exception:
            import tensorflow as tf

            _background_model = tf.keras.models.load_model(final_path, compile=False)
    except Exception as exc:
        logger.warning("Background model initialization failed: %s", exc)
    return _background_model
