import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';

class AuthSheetWrapper extends StatelessWidget {
  final Widget child;

  const AuthSheetWrapper({
    super.key,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final sheetColor = isDark ? SasColors.darkSurface : Colors.white;
    final borderColor = isDark
        ? SasColors.indianInk.withValues(alpha: 0.6)
        : SasColors.polishWhite;
    final handleColor = isDark
        ? SasColors.indianInk
        : const Color(0xFFD6D9D8);

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: sheetColor,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(32),
        ),
        border: Border(
          top: BorderSide(color: borderColor, width: 1.2),
          left: BorderSide(color: borderColor, width: 0.8),
          right: BorderSide(color: borderColor, width: 0.8),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.40 : 0.08),
            blurRadius: 28,
            offset: const Offset(0, -8),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        bottom: true,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 14, 24, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: handleColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              child,
            ],
          ),
        ),
      ),
    );
  }
}
