import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/app/theme_provider.dart';

class AppearanceSettingTile extends ConsumerWidget {
  const AppearanceSettingTile({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final themeLabel = themeMode == ThemeMode.light
        ? 'Light theme (Default)'
        : (themeMode == ThemeMode.dark ? 'Dark theme' : 'System theme');

    return ListTile(
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      leading: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: SasColors.osageOrange.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Icon(
          Icons.palette_outlined,
          color: SasColors.osageOrange,
          size: 16,
        ),
      ),
      title: const Text(
        'Appearance',
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: SasColors.textPrimary,
        ),
      ),
      subtitle: Text(
        themeLabel,
        style: const TextStyle(
          fontSize: 11,
          color: SasColors.textMuted,
        ),
      ),
      trailing: const Icon(
        Icons.chevron_right_rounded,
        size: 18,
        color: SasColors.textMuted,
      ),
      onTap: () => _showThemeModal(context, ref, themeMode),
    );
  }

  void _showThemeModal(BuildContext context, WidgetRef ref, ThemeMode current) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _themeOption(
                title: 'Light Theme',
                subtitle: 'Crisp Brilliance canvas with Indian Ink typography',
                isSelected: current == ThemeMode.light,
                onTap: () {
                  ref.read(themeModeProvider.notifier).setThemeMode(ThemeMode.light);
                  Navigator.of(ctx).pop();
                },
              ),
              _themeOption(
                title: 'Dark Theme',
                subtitle: 'Deep Slate canvas with glowing Osage Orange accents',
                isSelected: current == ThemeMode.dark,
                onTap: () {
                  ref.read(themeModeProvider.notifier).setThemeMode(ThemeMode.dark);
                  Navigator.of(ctx).pop();
                },
              ),
              _themeOption(
                title: 'System Adaptive',
                subtitle: 'Follows your phone system appearance',
                isSelected: current == ThemeMode.system,
                onTap: () {
                  ref.read(themeModeProvider.notifier).setThemeMode(ThemeMode.system);
                  Navigator.of(ctx).pop();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _themeOption({
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
          color: SasColors.textPrimary,
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(fontSize: 12, color: SasColors.textMuted),
      ),
      trailing: isSelected
          ? const Icon(Icons.check_circle_rounded, color: SasColors.osageOrange, size: 20)
          : const Icon(Icons.circle_outlined, color: SasColors.glassBorder, size: 20),
      onTap: onTap,
    );
  }
}
