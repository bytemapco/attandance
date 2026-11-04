import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smart_attendance_app/app/theme.dart';

class FlaggedTroubleshootFaq extends StatefulWidget {
  const FlaggedTroubleshootFaq({super.key});

  @override
  State<FlaggedTroubleshootFaq> createState() => _FlaggedTroubleshootFaqState();
}

class _FlaggedTroubleshootFaqState extends State<FlaggedTroubleshootFaq> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? SasColors.darkSurface : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? SasColors.textSecondary : SasColors.ivory,
        ),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
          childrenPadding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
          title: Text(
            'Troubleshooting & tips',
            style: GoogleFonts.plusJakartaSans(
              fontWeight: FontWeight.w600,
              fontSize: 14,
              color: isDark ? Colors.white : SasColors.ink,
            ),
          ),
          trailing: Icon(
            _expanded
                ? Icons.keyboard_arrow_up_rounded
                : Icons.keyboard_arrow_down_rounded,
            color: isDark ? SasColors.mutedOnDark : SasColors.textMuted,
          ),
          onExpansionChanged: (v) => setState(() => _expanded = v),
          children: const [
            _TipItem(
              icon: Icons.wb_sunny_outlined,
              title: 'Lighting conditions',
              desc:
                  'Ensure even front lighting. Avoid strong backlights or dark shadows.',
            ),
            SizedBox(height: 10),
            _TipItem(
              icon: Icons.face_retouching_off_rounded,
              title: 'Facial obstruction',
              desc: 'Keep hair, masks, or hands away from your eyes and mouth.',
            ),
            SizedBox(height: 10),
            _TipItem(
              icon: Icons.location_on_outlined,
              title: 'Classroom vicinity',
              desc: 'Mark attendance from inside the assigned lecture hall.',
            ),
          ],
        ),
      ),
    );
  }
}

class _TipItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String desc;

  const _TipItem({required this.icon, required this.title, required this.desc});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: SasColors.copper.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: SasColors.copper),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                  color: isDark ? Colors.white : SasColors.ink,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                desc,
                style: GoogleFonts.plusJakartaSans(
                  color: isDark
                      ? SasColors.mutedOnDark
                      : SasColors.textMuted,
                  fontSize: 11,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
