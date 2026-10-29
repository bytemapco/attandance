class SystemConfiguration {
  final bool isFaceRecognitionEnabled;
  final bool isGpsVerificationEnabled;
  final bool isAiBackgroundValidationEnabled;

  SystemConfiguration({
    required this.isFaceRecognitionEnabled,
    required this.isGpsVerificationEnabled,
    required this.isAiBackgroundValidationEnabled,
  });

  factory SystemConfiguration.fromJson(Map<String, dynamic> json) {
    return SystemConfiguration(
      isFaceRecognitionEnabled:
          (json['isFaceRecognitionEnabled'] ??
              json['is_face_recognition_enabled']) ??
          true,
      isGpsVerificationEnabled:
          (json['isGpsVerificationEnabled'] ??
              json['is_gps_verification_enabled']) ??
          true,
      isAiBackgroundValidationEnabled:
          (json['isAiBackgroundValidationEnabled'] ??
              json['is_ai_background_validation_enabled']) ??
          true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'isFaceRecognitionEnabled': isFaceRecognitionEnabled,
      'isGpsVerificationEnabled': isGpsVerificationEnabled,
      'isAiBackgroundValidationEnabled': isAiBackgroundValidationEnabled,
    };
  }
}
