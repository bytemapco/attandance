import contextlib
import os
import sys
from typing import Dict, Generator, List, Optional
from app.core.logging_config import get_logger

logger = get_logger("app.core.hardware")


@contextlib.contextmanager
def _silence_c_stderr() -> Generator[None, None, None]:
    """Redirects OS file descriptor 2 (STDERR) to /dev/null across Linux, macOS, and Windows."""
    try:
        null_fd = os.open(os.devnull, os.O_RDWR)
        saved_stderr = os.dup(2)
        os.dup2(null_fd, 2)
    except OSError:
        yield
        return

    try:
        yield
    finally:
        try:
            os.dup2(saved_stderr, 2)
            os.close(saved_stderr)
            os.close(null_fd)
        except OSError:
            pass


class HardwareManager:
    """Cross-platform AI compute hardware manager (GPU / CPU) with dynamic memory growth and fallback."""

    def __init__(self) -> None:
        self.target_device: str = "auto"
        self.active_device: str = "CPU"
        self.device_type: str = "CPU"
        self.gpus_detected: List[str] = []
        self.memory_growth_enabled: bool = False
        self.memory_limit_mb: Optional[int] = None
        self.fallback_occurred: bool = False
        self.fallback_reason: Optional[str] = None
        self._initialized: bool = False

    @staticmethod
    def _register_nvidia_paths() -> None:
        """Discovers pip-installed nvidia runtime libraries and appends them to library search paths."""
        try:
            for path_entry in sys.path:
                nvidia_dir = os.path.join(path_entry, "nvidia")
                if os.path.isdir(nvidia_dir):
                    for pkg in os.listdir(nvidia_dir):
                        lib_dir = os.path.join(nvidia_dir, pkg, "lib")
                        if os.path.isdir(lib_dir):
                            current_ld = os.environ.get("LD_LIBRARY_PATH", "")
                            if lib_dir not in current_ld:
                                os.environ["LD_LIBRARY_PATH"] = f"{lib_dir}:{current_ld}" if current_ld else lib_dir
        except Exception:
            pass

    def initialize(
        self,
        target_device: Optional[str] = None,
        memory_limit_mb: Optional[int] = None,
        allow_fallback: bool = True,
    ) -> Dict[str, object]:
        """Configures device placement, dynamic memory growth, and fallback before models load."""
        if self._initialized:
            return self.get_status()

        target = (target_device or os.getenv("AI_DEVICE", "auto")).strip().lower()
        self.target_device = target
        self.memory_limit_mb = memory_limit_mb

        self._register_nvidia_paths()

        os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
        os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")
        os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")

        if target in ("cpu", "none"):
            self._configure_cpu_mode(reason="Explicitly requested by configuration")
            self._initialized = True
            return self.get_status()

        try:
            with _silence_c_stderr():
                import tensorflow as tf
        except ImportError as import_err:
            self._configure_cpu_mode(reason=f"TensorFlow not installed: {import_err}")
            self._initialized = True
            return self.get_status()

        try:
            with _silence_c_stderr():
                physical_gpus = tf.config.list_physical_devices("GPU")
            self.gpus_detected = [gpu.name for gpu in physical_gpus]

            if not physical_gpus:
                self._configure_cpu_mode(reason="No physical GPU detected by TensorFlow")
                self._initialized = True
                return self.get_status()

            for gpu in physical_gpus:
                if memory_limit_mb and memory_limit_mb > 0:
                    tf.config.set_logical_device_configuration(
                        gpu,
                        [tf.config.LogicalDeviceConfiguration(memory_limit=memory_limit_mb)],
                    )
                else:
                    tf.config.experimental.set_memory_growth(gpu, True)
                    self.memory_growth_enabled = True

            with _silence_c_stderr():
                with tf.device("/GPU:0"):
                    probe_tensor = tf.constant([1.0, 2.0], dtype=tf.float32)
                    _ = tf.reduce_sum(probe_tensor)

            self.active_device = physical_gpus[0].name
            self.device_type = "GPU"
            self._initialized = True
            logger.info("AI Hardware successfully initialized on GPU: %s", self.active_device)
            return self.get_status()

        except Exception as hardware_err:
            error_message = str(hardware_err).strip()
            if not allow_fallback and target in ("cuda", "gpu"):
                logger.error("GPU initialization failed and fallback is disabled: %s", error_message)
                raise RuntimeError(f"GPU initialization failed: {error_message}") from hardware_err

            logger.info("GPU acceleration not available (%s). Operating on CPU.", error_message)
            self._configure_cpu_mode(reason=error_message)
            self.fallback_occurred = True
            self.fallback_reason = error_message
            self._initialized = True
            return self.get_status()

    def _configure_cpu_mode(self, reason: str) -> None:
        """Disables GPU visibility safely and routes computations to CPU."""
        self.active_device = "/device:CPU:0"
        self.device_type = "CPU"
        try:
            if "tensorflow" in sys.modules:
                import tensorflow as tf

                with _silence_c_stderr():
                    tf.config.set_visible_devices([], "GPU")
            else:
                os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
        except Exception:
            os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

        logger.info("AI Hardware running on CPU (%s)", reason)

    def get_status(self) -> Dict[str, object]:
        """Returns the current hardware acceleration status."""
        return {
            "target_device": self.target_device,
            "active_device": self.active_device,
            "device_type": self.device_type,
            "gpus_detected": self.gpus_detected,
            "memory_growth_enabled": self.memory_growth_enabled,
            "memory_limit_mb": self.memory_limit_mb,
            "fallback_occurred": self.fallback_occurred,
            "fallback_reason": self.fallback_reason,
            "is_gpu": self.device_type == "GPU",
        }


hardware_manager = HardwareManager()
