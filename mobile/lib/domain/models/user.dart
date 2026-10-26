
class TokenResponse {
  final String accessToken;
  final String tokenType;
  final String role;
  final bool mustChangePassword;
  final String? tenantId;
  final String? tenantSlug;
  final String? tenantName;

  const TokenResponse({
    required this.accessToken,
    required this.tokenType,
    required this.role,
    this.mustChangePassword = false,
    this.tenantId,
    this.tenantSlug,
    this.tenantName,
  });

  factory TokenResponse.fromJson(Map<String, dynamic> json) => TokenResponse(
        accessToken: json['access_token'] as String,
        tokenType: json['token_type'] as String,
        role: json['role'] as String,
        mustChangePassword: json['must_change_password'] as bool? ?? false,
        tenantId: json['tenant_id'] as String?,
        tenantSlug: json['tenant_slug'] as String?,
        tenantName: json['tenant_name'] as String?,
      );
}

class StudentProfile {
  final String id;
  final String enrollmentNumber;
  final String? firstName;
  final String? lastName;
  final String? phone;
  final String? gender;
  final String? branch;
  final int? semester;
  final String? batch;
  final String? departmentId;
  final String? departmentName;
  final bool faceRegistered;

  const StudentProfile({
    required this.id,
    required this.enrollmentNumber,
    this.firstName,
    this.lastName,
    this.phone,
    this.gender,
    this.branch,
    this.semester,
    this.batch,
    this.departmentId,
    this.departmentName,
    this.faceRegistered = false,
  });

  factory StudentProfile.fromJson(Map<String, dynamic> json) => StudentProfile(
        id: json['id'] as String,
        enrollmentNumber: json['enrollment_number'] as String,
        firstName: json['first_name'] as String?,
        lastName: json['last_name'] as String?,
        phone: json['phone'] as String?,
        gender: json['gender'] as String?,
        branch: json['branch'] as String?,
        semester: json['semester'] as int?,
        batch: json['batch'] as String?,
        departmentId: json['department_id'] as String?,
        departmentName: json['department_name'] as String?,
        faceRegistered: json['face_registered'] as bool? ?? false,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'enrollment_number': enrollmentNumber,
        'first_name': firstName,
        'last_name': lastName,
        'phone': phone,
        'gender': gender,
        'branch': branch,
        'semester': semester,
        'batch': batch,
        'department_id': departmentId,
        'department_name': departmentName,
        'face_registered': faceRegistered,
      };
}

class UserProfile {
  final String id;
  final String email;
  final String role;
  final bool isActive;
  final bool mustChangePassword;
  final String? tenantId;
  final String? tenantSlug;
  final String? tenantName;
  final StudentProfile? studentProfile;

  const UserProfile({
    required this.id,
    required this.email,
    required this.role,
    required this.isActive,
    this.mustChangePassword = false,
    this.tenantId,
    this.tenantSlug,
    this.tenantName,
    this.studentProfile,
  });

  bool get hasFaceRegistered => studentProfile?.faceRegistered ?? false;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    final studentJson = json['student_profile'] as Map<String, dynamic>?;
    return UserProfile(
      id: json['id'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      isActive: json['is_active'] as bool,
      mustChangePassword: json['must_change_password'] as bool? ?? false,
      tenantId: json['tenant_id'] as String?,
      tenantSlug: json['tenant_slug'] as String?,
      tenantName: json['tenant_name'] as String?,
      studentProfile:
          studentJson != null ? StudentProfile.fromJson(studentJson) : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'role': role,
        'is_active': isActive,
        'must_change_password': mustChangePassword,
        'tenant_id': tenantId,
        'tenant_slug': tenantSlug,
        'tenant_name': tenantName,
        'student_profile': studentProfile?.toJson(),
      };
}
