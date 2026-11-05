import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:smart_attendance_app/data/api/websocket_service.dart';

/// Calls [refresh] whenever the server says this student's attendance changed (for example a
/// teacher approves a flagged mark). Stops when the provider is disposed.
void refreshOnAttendanceUpdate(Ref ref, void Function() refresh) {
  final subscription = ref
      .read(websocketServiceProvider)
      .messageStream
      .where((message) => message['type'] == 'attendance_updated')
      .listen((_) => refresh());
  ref.onDispose(subscription.cancel);
}
