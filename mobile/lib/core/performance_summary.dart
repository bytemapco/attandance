import 'package:smart_attendance_app/domain/models/analytics.dart';

String _classes(int n) => '$n ${n == 1 ? 'class' : 'classes'}';

String _minimum(double threshold) =>
    '${threshold.toStringAsFixed(threshold == threshold.roundToDouble() ? 0 : 1)}%';

/// One plain sentence on where the student stands overall. The figures come from the server;
/// this only puts them into words.
String performanceSummary(StudentAnalytics analytics) {
  final overall = analytics.overall;
  final minimum = _minimum(analytics.threshold);
  switch (overall.standing) {
    case Standing.noData:
      return 'No classes have been held yet. Your figures appear after the first class.';
    case Standing.shortage:
      return 'You are below the $minimum minimum. Attending the next '
          '${_classes(overall.mustAttend)} in a row gets you back to it.';
    case Standing.atRisk:
      return overall.canMiss == 0
          ? 'You are close to the $minimum minimum. One more absence would take you below it.'
          : 'You are close to the $minimum minimum. You can miss ${_classes(overall.canMiss)} '
                'before you fall below it.';
    case Standing.ok:
      return 'You are above the $minimum minimum. You can miss ${_classes(overall.canMiss)} '
          'and still stay on track.';
  }
}

/// The line under a subject's figures: how many it can still miss, or how many it must attend.
String? subjectAdvice(AttendanceFigures figures) {
  switch (figures.standing) {
    case Standing.noData:
      return null;
    case Standing.shortage:
      return 'Attend the next ${_classes(figures.mustAttend)} to recover';
    case Standing.atRisk || Standing.ok:
      return figures.canMiss == 0
          ? 'No classes can be missed'
          : 'Can miss ${_classes(figures.canMiss)}';
  }
}

/// A banner for subjects below the minimum, or null when there are none.
String? shortageBanner(StudentAnalytics analytics) {
  final names = analytics.shortages.map((s) => s.subjectName).toList();
  if (names.isEmpty) return null;
  final list = names.length <= 2
      ? names.join(' and ')
      : '${names.take(2).join(', ')} and ${names.length - 2} more';
  return 'Below the ${_minimum(analytics.threshold)} minimum in $list.';
}
