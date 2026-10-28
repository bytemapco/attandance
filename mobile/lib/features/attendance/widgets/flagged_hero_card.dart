import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:smart_attendance_app/core/attendance_utils.dart';
import 'package:smart_attendance_app/domain/models/attendance.dart';

class FlaggedHeroCard extends StatelessWidget {
  final AttendanceHistoryItem item;

  const FlaggedHeroCard({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isFlagged = item.status == 'Flagged';
    final col = isFlagged ? const Color(0xFFF95721) : statusColor(item.status);
    final hasSubject = item.subject.isNotEmpty &&
        !item.className.toLowerCase().contains(item.subject.toLowerCase()) &&
        !item.subject.toLowerCase().contains(item.className.toLowerCase());

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.03),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: col.withValues(alpha: isDark ? 0.16 : 0.10),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: col.withValues(alpha: 0.22), width: 1.2),
            ),
            child: Icon(
              isPresentOrApproved(item.status) ? Icons.check_circle_rounded : Icons.schedule_rounded,
              color: col,
              size: 28,
            ),
          ),
          const SizedBox(height: 14),
          Text(
            item.className,
            style: GoogleFonts.plusJakartaSans(
              fontWeight: FontWeight.w800,
              fontSize: 18,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
              letterSpacing: -0.3,
            ),
            textAlign: TextAlign.center,
          ),
          if (hasSubject) ...[
            const SizedBox(height: 3),
            Text(
              item.subject,
              style: GoogleFonts.plusJakartaSans(
                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: isFlagged
                  ? (isDark ? const Color(0xFF3B1E24) : const Color(0xFFFFEEEE))
                  : col.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              isFlagged ? 'Pending review' : item.status,
              style: GoogleFonts.plusJakartaSans(
                color: col,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            DateFormat('EEEE, MMM d · h:mm a').format(item.markedAt),
            style: GoogleFonts.plusJakartaSans(
              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
