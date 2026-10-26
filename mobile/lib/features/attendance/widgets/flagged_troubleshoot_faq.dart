import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class FlaggedTroubleshootFaq extends StatefulWidget {
  const FlaggedTroubleshootFaq({super.key});

  @override
  State<FlaggedTroubleshootFaq> createState() => _FlaggedTroubleshootFaqState();
}

class _FlaggedTroubleshootFaqState extends State<FlaggedTroubleshootFaq> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: EdgeInsets.zero,
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
          childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
          title: const Text(
            'Troubleshooting & Tips',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: SasColors.textPrimary),
          ),
          trailing: Icon(
            _expanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
            color: SasColors.textMuted,
          ),
          onExpansionChanged: (v) => setState(() => _expanded = v),
          children: const [
            _TipItem(
              icon: Icons.wb_sunny_outlined,
              title: 'Lighting conditions',
              desc: 'Ensure even front lighting. Avoid strong backlights or dark shadows.',
            ),
            SizedBox(height: 8),
            _TipItem(
              icon: Icons.face_retouching_off_rounded,
              title: 'Facial obstruction',
              desc: 'Keep hair, masks, or hands away from your eyes and mouth.',
            ),
            SizedBox(height: 8),
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
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: SasColors.textSecondary),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: SasColors.textPrimary)),
              const SizedBox(height: 1),
              Text(desc, style: const TextStyle(color: SasColors.textMuted, fontSize: 11, height: 1.3)),
            ],
          ),
        ),
      ],
    );
  }
}
