import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smart_attendance_app/app/theme.dart';

class GlassAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final bool showBack;

  const GlassAppBar({
    super.key,
    required this.title,
    this.actions,
    this.showBack = false,
  });

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? SasColors.brilliance : SasColors.indianInk;
    final bgColor = isDark ? SasColors.darkSurface : SasColors.lightSurface;
    final borderColor = isDark
        ? const Color(0x1EFFFFFF)
        : const Color(0x14000000);

    bool canPop = false;
    try {
      canPop = GoRouter.of(context).canPop();
    } catch (_) {
      canPop = ModalRoute.of(context)?.canPop ?? false;
    }

    return Container(
      decoration: BoxDecoration(
        color: bgColor,   // Fixed: was hardcoded bgSecondary (white) in dark mode
        border: Border(
          bottom: BorderSide(color: borderColor, width: 0.5),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            children: [
              if (showBack || canPop)
                IconButton(
                  icon: Icon(Icons.arrow_back_ios_new_rounded, size: 18),
                  color: textColor,
                  onPressed: () {
                    try {
                      context.pop();
                    } catch (_) {
                      Navigator.of(context).maybePop();
                    }
                  },
                )
              else
                const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                    letterSpacing: -0.3,
                  ),
                  textAlign: (showBack || canPop)
                      ? TextAlign.left
                      : TextAlign.center,
                ),
              ),
              if (actions != null) ...actions!
              else const SizedBox(width: 48),
            ],
          ),
        ),
      ),
    );
  }
}
