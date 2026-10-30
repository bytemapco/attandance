import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';

PreferredSizeWidget buildFlaggedDetailAppBar({
  required BuildContext context,
  required bool isDark,
  required VoidCallback onBack,
}) {
  return AppBar(
    backgroundColor: isDark ? SasColors.darkCanvas : const Color(0xFFF4F7FB),
    elevation: 0,
    centerTitle: true,
    leading: IconButton(
      icon: Icon(
        Icons.arrow_back_ios_new_rounded,
        size: 18,
        color: isDark ? Colors.white : const Color(0xFF0F172A),
      ),
      onPressed: onBack,
    ),
    title: Text(
      'Flagged Record',
      style: GoogleFonts.plusJakartaSans(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: isDark ? Colors.white : const Color(0xFF0F172A),
      ),
    ),
  );
}

class FlaggedDetailEmptyScaffold extends StatelessWidget {
  final bool isDark;
  final bool isLoading;
  final VoidCallback onBack;

  const FlaggedDetailEmptyScaffold({
    super.key,
    required this.isDark,
    required this.isLoading,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) onBack();
      },
      child: Scaffold(
        backgroundColor: isDark
            ? SasColors.darkCanvas
            : const Color(0xFFF4F7FB),
        appBar: buildFlaggedDetailAppBar(
          context: context,
          isDark: isDark,
          onBack: onBack,
        ),
        body: Center(
          child: isLoading
              ? const CircularProgressIndicator(color: Color(0xFFF95721))
              : Text(
                  'Record not found',
                  style: GoogleFonts.plusJakartaSans(
                    color: isDark
                        ? const Color(0xFF94A3B8)
                        : const Color(0xFF64748B),
                  ),
                ),
        ),
      ),
    );
  }
}
