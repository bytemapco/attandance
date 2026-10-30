library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:smart_attendance_app/core/constants.dart';
import 'package:smart_attendance_app/domain/models/app_notification.dart';


export 'package:smart_attendance_app/domain/models/app_notification.dart';
export 'package:smart_attendance_app/features/notifications/providers/notifications_provider.dart';

final notificationServiceProvider = Provider<NotificationService>(
  (ref) => NotificationService(),
);

class NotificationService {
  Box<Map<dynamic, dynamic>>? _box;
  bool get isInitialized => _box != null;

  Future<void> initialize() async {
    _box = await Hive.openBox<Map<dynamic, dynamic>>(kHiveBoxNotifications);
  }

  Future<void> _ensureInit() async {
    if (_box == null) await initialize();
  }

  Future<void> addNotification({
    String? id,
    required String title,
    required String body,
    required String severity,
    String category = 'system',
    String? link,
    String source = 'local',
    bool isRead = false,
  }) async {
    await _ensureInit();
    final item = LocalNotification(
      id: id,
      title: title,
      body: body,
      timestamp: DateTime.now(),
      severity: severity,
      category: category,
      link: link,
      source: source,
      isRead: isRead,
    );
    await _box?.put(item.id, item.toMap());
  }

  List<LocalNotification> getNotifications() {
    if (_box == null) return [];
    final items = _box!.values
        .map((m) => LocalNotification.fromMap(m))
        .toList();
    items.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return items;
  }

  Future<void> replaceAll(List<LocalNotification> items) async {
    await _ensureInit();
    await _box?.clear();
    for (final n in items) {
      await _box?.put(n.id, n.toMap());
    }
  }

  Future<void> clearAll() async => _box?.clear();
}

