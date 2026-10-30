import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/typography.dart';
import 'package:smart_attendance_app/data/api/dio_client.dart';
import 'package:smart_attendance_app/data/local/device_service.dart';
import 'package:smart_attendance_app/features/auth/widgets/device_change_dialog_actions.dart';
import 'package:smart_attendance_app/features/auth/widgets/device_change_dialog_parts.dart';
import 'package:smart_attendance_app/utils/logger.dart';

class DeviceChangeDialog extends ConsumerStatefulWidget {
  final String email;
  final String password;

  const DeviceChangeDialog({
    super.key,
    required this.email,
    required this.password,
  });

  @override
  ConsumerState<DeviceChangeDialog> createState() => _DeviceChangeDialogState();
}

class _DeviceChangeDialogState extends ConsumerState<DeviceChangeDialog> {
  final _reasonController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _submitRequest() async {
    setState(() => _isLoading = true);
    try {
      final dio = ref.read(dioProvider);
      final deviceService = ref.read(deviceServiceProvider);
      final newDeviceUuid = await deviceService.getDeviceUUID();

      await dio.post(
        '/auth/request-device-change',
        data: {
          'email': widget.email,
          'password': widget.password,
          'new_device_uuid': newDeviceUuid,
          'reason': _reasonController.text.trim(),
        },
      );

      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (e) {
      AppLogger.error('Failed to request device change: $e');
      if (!mounted) return;

      String errorMessage = 'Failed to submit request. Please try again.';
      if (e is DioException && e.response?.data is Map) {
        final data = e.response!.data as Map;
        if (data['detail'] is String) {
          errorMessage = data['detail'] as String;
        } else if (data['message'] is String) {
          errorMessage = data['message'] as String;
        }
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            errorMessage,
            style: SasTypography.style(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: Colors.white,
            ),
          ),
          backgroundColor: SasColors.danger,
        ),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dialogBg = isDark ? const Color(0xFF1E2838) : Colors.white;
    final primaryText = isDark ? SasColors.brilliance : const Color(0xFF0F172A);
    final secondaryText =
        isDark ? const Color(0xFFCBD5E1) : const Color(0xFF64748B);
    final inputBg = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final inputBorder =
        isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 400),
        child: Container(
          decoration: BoxDecoration(
            color: dialogBg,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.12),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(22, 22, 22, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                DeviceChangeHeader(isDark: isDark, primaryText: primaryText),
                const SizedBox(height: 14),
                Text(
                  'Your account is currently bound to another phone. Submit a request to your instructor or admin to authorize this device.',
                  style: SasTypography.style(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w400,
                    color: secondaryText,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 18),
                DeviceChangeReasonInput(
                  controller: _reasonController,
                  inputBg: inputBg,
                  inputBorder: inputBorder,
                  primaryText: primaryText,
                  secondaryText: secondaryText,
                ),
                DeviceChangeActions(
                  isLoading: _isLoading,
                  secondaryText: secondaryText,
                  onCancel: () => Navigator.of(context).pop(false),
                  onSubmit: _submitRequest,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
