import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/data/api/dio_client.dart';

final notificationApiProvider = Provider<NotificationApi>((ref) {
  return NotificationApi(ref.read(dioProvider));
});

class NotificationApiItem {
  final String id;
  final String? userId;
  final String? role;
  final String title;
  final String message;
  final String type;
  final String category;
  final String? link;
  final bool isRead;
  final DateTime createdAt;

  const NotificationApiItem({
    required this.id,
    this.userId,
    this.role,
    required this.title,
    required this.message,
    required this.type,
    required this.category,
    this.link,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationApiItem.fromJson(Map<String, dynamic> json) {
    return NotificationApiItem(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String?,
      role: json['role'] as String?,
      title: json['title'] as String? ?? '',
      message: json['message'] as String? ?? '',
      type: json['type'] as String? ?? 'info',
      category: json['category'] as String? ?? 'system',
      link: json['link'] as String?,
      isRead: json['is_read'] as bool? ?? false,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class NotificationListResult {
  final List<NotificationApiItem> items;
  final int totalCount;
  final int unreadCount;

  const NotificationListResult({
    required this.items,
    required this.totalCount,
    required this.unreadCount,
  });

  factory NotificationListResult.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    return NotificationListResult(
      items: rawItems
          .map((e) => NotificationApiItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalCount: json['total_count'] as int? ?? 0,
      unreadCount: json['unread_count'] as int? ?? 0,
    );
  }
}

class NotificationApi {
  final Dio _dio;

  const NotificationApi(this._dio);

  Future<NotificationListResult> getNotifications({
    bool unreadOnly = false,
    String? category,
    int page = 1,
    int pageSize = 40,
  }) async {
    final queryParams = <String, dynamic>{
      'unread_only': unreadOnly,
      'page': page,
      'page_size': pageSize,
    };
    if (category != null && category.isNotEmpty && category != 'all') {
      queryParams['category'] = category;
    }

    final response = await _dio.get<Map<String, dynamic>>(
      '/notifications',
      queryParameters: queryParams,
    );
    return NotificationListResult.fromJson(response.data!);
  }

  Future<void> markRead(String notificationId) async {
    await _dio.patch<void>('/notifications/$notificationId/read');
  }

  Future<void> markAllRead() async {
    await _dio.patch<void>('/notifications/mark-all-read');
  }

  Future<void> deleteNotification(String notificationId) async {
    await _dio.delete<void>('/notifications/$notificationId');
  }

  Future<void> deleteAll() async {
    await _dio.delete<void>('/notifications/all');
  }
}
