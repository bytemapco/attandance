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
    bool canPop = false;
    try {
      canPop = GoRouter.of(context).canPop();
    } catch (_) {
      canPop = ModalRoute.of(context)?.canPop ?? false;
    }

    return Container(
      decoration: const BoxDecoration(
        color: SasColors.bgSecondary,
        border: Border(
          bottom: BorderSide(color: SasColors.glassBorder),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(
            children: [
              if (showBack || canPop)
                IconButton(
                  icon: const Icon(Icons.arrow_back_rounded, size: 20),
                  color: SasColors.textPrimary,
                  splashRadius: 20,
                  onPressed: () {
                    try {
                      context.pop();
                    } catch (_) {
                      Navigator.of(context).maybePop();
                    }
                  },
                ),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: SasColors.textPrimary,
                    letterSpacing: -0.01,
                  ),
                  textAlign:
                      (showBack || canPop) ? TextAlign.left : TextAlign.center,
                ),
              ),
              if (actions != null) ...actions!,
            ],
          ),
        ),
      ),
    );
  }
}
