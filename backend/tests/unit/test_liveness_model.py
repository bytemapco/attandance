"""The bundled liveness model loads, scores within [0, 1], and matches its shipped inference config."""
import json
import os

import numpy as np
import pytest

from app.services import ai_models
from app.services.ai_orchestrator import AIOrchestrator
from app.services.occurrence_marking_service import LIVENESS_MIN

CONFIG_PATH = os.path.join(os.path.dirname(ai_models.LIVENESS_MODEL_PATH), "liveness_inference_config.json")


@pytest.fixture(scope="module")
def inference_config():
    with open(CONFIG_PATH, encoding="utf-8") as handle:
        return json.load(handle)


def test_liveness_threshold_matches_the_shipped_model_config(inference_config):
    assert LIVENESS_MIN == pytest.approx(round(inference_config["threshold"], 2))


def test_liveness_model_file_is_the_keras_model_named_in_code():
    assert ai_models.LIVENESS_FILENAME == "liveness_mobilenetv2_final.keras"
    assert os.path.exists(ai_models.LIVENESS_MODEL_PATH)


def test_liveness_preprocessing_scales_pixels_to_minus_one_one():
    face = np.zeros((300, 260, 3), dtype=np.uint8)
    face[:, :, 1] = 255
    processed = AIOrchestrator._preprocess_liveness(face)
    assert processed.shape == (1, 224, 224, 3)
    assert processed.dtype == np.float32
    assert np.allclose(processed[0, :, :, 0], -1.0)
    assert np.allclose(processed[0, :, :, 1], 1.0)


def test_liveness_model_loads_and_scores_a_face_crop_in_the_pipeline(inference_config):
    model = ai_models.get_liveness_model()
    assert model is not None
    assert tuple(model.input_shape) == (None, *inference_config["img_size"], 3)
    face = np.full((300, 260, 3), 128, dtype=np.uint8)
    score = AIOrchestrator()._run_liveness_inference(face)
    assert score is not None and 0.0 <= score <= 1.0
