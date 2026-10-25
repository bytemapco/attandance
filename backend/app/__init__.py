from app.core.hardware import hardware_manager

# Initialize hardware (detects GPU / CPU, configures dynamic memory growth, sets fallback)
hardware_manager.initialize()
