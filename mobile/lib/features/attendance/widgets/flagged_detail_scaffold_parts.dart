import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/shimmer_placeholder.dart';

PreferredSizeWidget buildFlaggedDetailAppBar({
  required BuildContext context,
  required bool isDark,
  required VoidCallback onBack,
}) {
  return AppBar(
    backgroundColor: isDark ? SasColors.darkCanvas : SasColors.lightCanvas,
    elevation: 0,
    centerTitle: true,
    leading: IconButton(
      tooltip: 'Back',
      icon: Icon(
        Icons.arrow_back_ios_new_rounded,
        size: 18,
        color: isDark ? Colors.white : SasColors.ink,
      ),
      onPressed: onBack,
    ),
    title: Text(
      'Flagged Record',
      style: GoogleFonts.plusJakartaSans(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: isDark ? Colors.white : SasColors.ink,
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
            : SasColors.lightCanvas,
        appBar: buildFlaggedDetailAppBar(
          context: context,
          isDark: isDark,
          onBack: onBack,
        ),
        body: isLoading
            ? SafeArea(
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 480),
                    child: ListView(
                      padding: const EdgeInsets.all(20),
                      children: const [
                        ShimmerPlaceholder(itemCount: 3, itemHeight: 112),
                      ],
                    ),
                  ),
                ),
              )
            : Center(
                child: Text(
                  'Record not found',
                  style: GoogleFonts.plusJakartaSans(
                    color: isDark
                        ? SasColors.mutedOnDark
                        : SasColors.textMuted,
                  ),
                ),
              ),
      ),
    );
  }
}
