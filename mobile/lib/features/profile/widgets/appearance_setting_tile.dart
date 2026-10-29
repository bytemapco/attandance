import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/theme_provider.dart';
import 'package:smart_attendance_app/app/typography.dart';

class AppearanceSettingTile extends ConsumerWidget {
  const AppearanceSettingTile({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final themeLabel = themeMode == ThemeMode.light
        ? 'Light theme'
        : (themeMode == ThemeMode.dark ? 'Dark theme' : 'System theme');

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryTextColor = isDark
        ? SasColors.brilliance
        : const Color(0xFF0F172A);
    final subtitleColor = isDark
        ? const Color(0xFF94A3B8)
        : const Color(0xFF64748B);

    return InkWell(
      onTap: () => _showThemeModal(context, ref, themeMode),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF332314)
                    : const Color(0xFFFFEDD5),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.palette_rounded,
                color: Color(0xFFEA580C),
                size: 18,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Appearance',
                    style: SasTypography.style(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: primaryTextColor,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    themeLabel,
                    style: SasTypography.style(
                      color: subtitleColor,
                      fontSize: 11.5,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Icon(Icons.chevron_right_rounded, color: subtitleColor, size: 18),
          ],
        ),
      ),
    );
  }

  void _showThemeModal(BuildContext context, WidgetRef ref, ThemeMode current) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _themeOption(
                ctx,
                title: 'Light Theme',
                subtitle: 'Crisp ivory and warm apricot aesthetic',
                isSelected: current == ThemeMode.light,
                onTap: () {
                  ref
                      .read(themeModeProvider.notifier)
                      .setThemeMode(ThemeMode.light);
                  Navigator.of(ctx).pop();
                },
              ),
              _themeOption(
                ctx,
                title: 'Dark Theme',
                subtitle: 'Deep Slate canvas with glowing orange accents',
                isSelected: current == ThemeMode.dark,
                onTap: () {
                  ref
                      .read(themeModeProvider.notifier)
                      .setThemeMode(ThemeMode.dark);
                  Navigator.of(ctx).pop();
                },
              ),
              _themeOption(
                ctx,
                title: 'System Adaptive',
                subtitle: 'Follows your phone system appearance',
                isSelected: current == ThemeMode.system,
                onTap: () {
                  ref
                      .read(themeModeProvider.notifier)
                      .setThemeMode(ThemeMode.system);
                  Navigator.of(ctx).pop();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _themeOption(
    BuildContext context, {
    required String title,
    required String subtitle,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return ListTile(
      title: Text(
        title,
        style: TextStyle(
          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
          fontSize: 14,
          color: Theme.of(context).colorScheme.onSurface,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(fontSize: 12, color: SasColors.textMuted),
      ),
      trailing: isSelected
          ? const Icon(
              Icons.check_circle_rounded,
              color: Color(0xFFF95721),
              size: 20,
            )
          : const Icon(
              Icons.circle_outlined,
              color: SasColors.glassBorder,
              size: 20,
            ),
      onTap: onTap,
    );
  }
}
