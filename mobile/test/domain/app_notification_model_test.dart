import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/app/app.dart';
import 'package:smart_attendance_app/core/attendance_constants.dart';
import 'package:smart_attendance_app/domain/models/app_notification.dart';

void main() {
  group('LocalNotification Model', () {
    test('toMap and fromMap serialize and deserialize accurately', () {
      final now = DateTime.now();
      final original = LocalNotification(
        id: 'notif-1',
        title: 'Class Reminder',
        body: 'Algorithms class starts in 15 minutes',
        timestamp: now,
        severity: 'warning',
        category: 'attendance',
        isRead: false,
      );

      final map = original.toMap();
      final restored = LocalNotification.fromMap(map);

      expect(restored.id, original.id);
      expect(restored.title, original.title);
      expect(restored.body, original.body);
      expect(restored.severity, 'warning');
      expect(restored.category, 'attendance');
      expect(restored.isRead, isFalse);
    });

    test('copyWith updates isRead state immutably', () {
      final notif = LocalNotification(
        id: 'notif-2',
        title: 'New Grade',
        body: 'Score updated',
        timestamp: DateTime.now(),
        severity: 'info',
        isRead: false,
      );

      final readNotif = notif.copyWith(isRead: true);

      expect(notif.isRead, isFalse);
      expect(readNotif.isRead, isTrue);
      expect(readNotif.id, notif.id);
    });
  });

  group('inferNotificationSeverity', () {
    test('categorizes low attendance and anomalies as danger', () {
      expect(inferNotificationSeverity({'type': 'low_attendance'}), kSeverityDanger);
      expect(inferNotificationSeverity({'type': 'anomaly'}), kSeverityDanger);
    });

    test('categorizes warning and fallback types', () {
      expect(inferNotificationSeverity({'type': 'warning'}), kSeverityWarning);
      expect(inferNotificationSeverity({'type': 'info'}), kSeverityInfo);
      expect(inferNotificationSeverity({}), kSeverityInfo);
    });
  });
}
