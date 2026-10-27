import 'package:flutter/material.dart';
import 'package:smart_attendance_app/app/theme.dart';
import 'package:smart_attendance_app/shared/widgets/glass_card.dart';

class SmartPassGuidelinesCard extends StatelessWidget {
  const SmartPassGuidelinesCard({super.key});

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: SasColors.info.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(
                  Icons.shield_outlined,
                  size: 16,
                  color: SasColors.info,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'How Smart Pass Works',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: SasColors.textPrimaryOf(context),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _item('Scan the QR code displayed on the teacher screen.'),
          _item('Verifies your location in the classroom.'),
          _item('Confirms your registered device.'),
          _item('Records your attendance immediately.'),
        ],
      ),
    );
  }

  Widget _item(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.check_circle_rounded,
            size: 14,
            color: SasColors.accentEmerald,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 12,
                color: SasColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
