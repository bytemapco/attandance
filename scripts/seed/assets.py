import io
import cv2
import numpy as np


def generate_synthetic_face_bytes() -> bytes:
    """Generate a clean synthetic frontal human face JPEG in memory.

    Meets DeepFace OpenCV detector criteria and produces standard 128-dim embeddings.
    """
    img = np.full((320, 320, 3), 245, dtype=np.uint8)

    # Face contour (oval skin)
    cv2.ellipse(img, (160, 160), (85, 115), 0, 0, 360, (185, 215, 240), -1)

    # Hair / forehead shadow
    cv2.ellipse(img, (160, 95), (85, 45), 0, 180, 360, (40, 30, 25), -1)

    # Eyebrows
    cv2.ellipse(img, (125, 125), (20, 6), -10, 190, 350, (30, 20, 15), 3)
    cv2.ellipse(img, (195, 125), (20, 6), 10, 190, 350, (30, 20, 15), 3)

    # Eyes & pupils
    cv2.circle(img, (125, 140), 9, (255, 255, 255), -1)
    cv2.circle(img, (125, 140), 5, (40, 35, 30), -1)
    cv2.circle(img, (195, 140), 9, (255, 255, 255), -1)
    cv2.circle(img, (195, 140), 5, (40, 35, 30), -1)

    # Nose
    cv2.line(img, (160, 145), (155, 180), (120, 140, 170), 3)
    cv2.ellipse(img, (160, 183), (12, 5), 0, 0, 180, (100, 120, 150), 2)

    # Mouth & lips
    cv2.ellipse(img, (160, 215), (32, 14), 0, 0, 180, (80, 80, 190), -1)
    cv2.ellipse(img, (160, 212), (30, 6), 0, 0, 180, (255, 255, 255), -1)

    success, buffer = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
    if not success:
        raise ValueError("Failed encoding synthetic face image.")
    return buffer.tobytes()


def get_face_upload_tuple(filename: str = "face.jpg") -> tuple[str, io.BytesIO, str]:
    """Return a tuple suitable for httpx multipart file upload: (filename, file_bytes, mime_type)."""
    raw_bytes = generate_synthetic_face_bytes()
    return (filename, io.BytesIO(raw_bytes), "image/jpeg")
