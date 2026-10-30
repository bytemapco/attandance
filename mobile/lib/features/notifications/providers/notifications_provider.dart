import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/data/api/notification_api.dart';
import 'package:smart_attendance_app/data/api/websocket_service.dart';
import 'package:smart_attendance_app/data/local/notification_service.dart';
import 'package:smart_attendance_app/data/local/secure_storage.dart';
import 'package:smart_attendance_app/utils/logger.dart';


final notificationsProvider =
    StateNotifierProvider<NotificationsNotifier, List<LocalNotification>>((
      ref,
    ) {
      return NotificationsNotifier(
        ref.read(notificationServiceProvider),
        ref.read(notificationApiProvider),
        ref.read(websocketServiceProvider),
        ref.read(secureStorageProvider),
      );
    });

final notificationsLoadingProvider = Provider<bool>((ref) {
  return ref.watch(notificationsProvider.notifier).isLoading;
});

class NotificationsNotifier extends StateNotifier<List<LocalNotification>> {
  final NotificationService _service;
  final NotificationApi _api;
  final WebSocketService _ws;
  final SecureStorageService _storage;
  StreamSubscription? _wsSub;
  bool _isLoading = false;

  bool get isLoading => _isLoading;

  NotificationsNotifier(this._service, this._api, this._ws, this._storage)
    : super([]) {
    load().then((_) => _listenWebSocket());
  }

  void _listenWebSocket() {
    _wsSub?.cancel();
    _wsSub = _ws.messageStream.listen((msg) {
      if (msg['event'] == 'NOTIFICATION_RECEIVED') {
        final d = msg['data'] as Map<String, dynamic>?;
        if (d != null) {
          final incoming = LocalNotification(
            id: d['id'] as String?,
            title: d['title'] as String? ?? 'Announcement',
            body: d['message'] as String? ?? '',
            timestamp: d['created_at'] != null
                ? DateTime.tryParse(d['created_at'] as String) ?? DateTime.now()
                : DateTime.now(),
            severity: d['type'] as String? ?? 'info',
            category: d['category'] as String? ?? 'system',
            link: d['link'] as String?,
            source: 'broadcast',
            isRead: d['is_read'] as bool? ?? false,
          );
          _service.addNotification(
            id: incoming.id,
            title: incoming.title,
            body: incoming.body,
            severity: incoming.severity,
            category: incoming.category,
            link: incoming.link,
            source: incoming.source,
            isRead: incoming.isRead,
          );
          state = [incoming, ...state.where((n) => n.id != incoming.id)];
        }
      }
    });
  }

  Future<void> load() async {
    _isLoading = true;
    if (!_service.isInitialized) await _service.initialize();
    state = _service.getNotifications();

    final token = await _storage.getToken();
    if (token == null || token.isEmpty) {
      _isLoading = false;
      return;
    }

    try {
      final remote = await _api.getNotifications(page: 1, pageSize: 40);
      final remoteList = remote.items
          .map(
            (i) => LocalNotification(
              id: i.id,
              title: i.title,
              body: i.message,
              timestamp: i.createdAt,
              severity: i.type,
              category: i.category,
              link: i.link,
              source: i.role != null || i.userId == null
                  ? 'broadcast'
                  : 'server',
              isRead: i.isRead,
            ),
          )
          .toList();

      final currentLocal = state.where((n) => n.source == 'local').toList();
      final Map<String, LocalNotification> merged = {};
      for (final n in [...remoteList, ...currentLocal]) {
        merged[n.id] = n;
      }
      final result = merged.values.toList()
        ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
      await _service.replaceAll(result);
      state = result;
    } catch (e) {
      AppLogger.debug('Remote notifications fallback: $e');
    } finally {
      _isLoading = false;
    }
  }

  Future<void> markRead(String id) async {
    final updated = state
        .map((n) => n.id == id ? n.copyWith(isRead: true) : n)
        .toList();
    await _service.replaceAll(updated);
    state = updated;
    try {
      await _api.markRead(id);
    } catch (_) {}
  }

  Future<void> markAllRead() async {
    final updated = state.map((n) => n.copyWith(isRead: true)).toList();
    await _service.replaceAll(updated);
    state = updated;
    try {
      await _api.markAllRead();
    } catch (_) {}
  }

  Future<void> deleteNotification(String id) async {
    final updated = state.where((n) => n.id != id).toList();
    await _service.replaceAll(updated);
    state = updated;
    try {
      await _api.deleteNotification(id);
    } catch (_) {}
  }

  Future<void> clear() async {
    await _service.clearAll();
    state = [];
    try {
      await _api.deleteAll();
    } catch (_) {}
  }

  @override
  void dispose() {
    _wsSub?.cancel();
    super.dispose();
  }
}
