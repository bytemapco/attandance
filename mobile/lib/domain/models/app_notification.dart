class LocalNotification {
  final String id;
  final String title;
  final String body;
  final DateTime timestamp;
  final String severity;
  final String category;
  final String? link;
  final String source;
  final bool isRead;

  LocalNotification({
    String? id,
    required this.title,
    required this.body,
    required this.timestamp,
    required this.severity,
    this.category = 'system',
    this.link,
    this.source = 'local',
    this.isRead = false,
  }) : id = id ?? '${timestamp.millisecondsSinceEpoch}_${title.hashCode}';

  Map<String, dynamic> toMap() => {
        'id': id,
        'title': title,
        'body': body,
        'timestamp': timestamp.toIso8601String(),
        'severity': severity,
        'category': category,
        'link': link,
        'source': source,
        'is_read': isRead,
      };

  factory LocalNotification.fromMap(Map<dynamic, dynamic> map) {
    return LocalNotification(
      id: map['id'] as String?,
      title: map['title'] as String? ?? '',
      body: map['body'] as String? ?? '',
      timestamp: map['timestamp'] != null
          ? DateTime.tryParse(map['timestamp'] as String) ?? DateTime.now()
          : DateTime.now(),
      severity: map['severity'] as String? ?? 'info',
      category: map['category'] as String? ?? 'system',
      link: map['link'] as String?,
      source: map['source'] as String? ?? 'local',
      isRead: map['is_read'] as bool? ?? false,
    );
  }

  LocalNotification copyWith({bool? isRead}) => LocalNotification(
        id: id,
        title: title,
        body: body,
        timestamp: timestamp,
        severity: severity,
        category: category,
        link: link,
        source: source,
        isRead: isRead ?? this.isRead,
      );
}
