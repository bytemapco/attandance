import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/features/home/widgets/home_header.dart';
import '../helpers/pump_app.dart';

class _Profile {
  final String? firstName;
  final String? lastName;
  _Profile(this.firstName, this.lastName);
}

class _User {
  final _Profile? studentProfile;
  final String? email;
  final String? tenantName;
  _User({this.studentProfile, this.email, this.tenantName});
}

void main() {
  setUpAll(disableFontFetching);

  testWidgets('shows first name, institution and initials', (tester) async {
    final user = _User(
      studentProfile: _Profile('Asha', 'Rao'),
      email: 'asha@example.edu',
      tenantName: 'Northfield College',
    );
    await pumpThemed(
      tester,
      HomeHeader(user: user, unreadCount: 0, onNotificationTap: () {}),
    );

    expect(find.text('Asha'), findsOneWidget);
    expect(find.text('Northfield College'), findsOneWidget);
    expect(find.text('AR'), findsOneWidget);
  });

  testWidgets('falls back to the email handle when there is no profile', (tester) async {
    final user = _User(email: 'ravi.kumar@example.edu');
    await pumpThemed(
      tester,
      HomeHeader(user: user, unreadCount: 0, onNotificationTap: () {}),
    );

    expect(find.text('ravi.kumar'), findsOneWidget);
    expect(find.text('R'), findsOneWidget);
  });

  testWidgets('hides the institution line when the tenant is unknown', (tester) async {
    await pumpThemed(
      tester,
      HomeHeader(user: null, unreadCount: 0, onNotificationTap: () {}),
    );

    expect(find.text('Student'), findsOneWidget);
    expect(find.text('Apex Institute of Technology'), findsNothing);
  });

  testWidgets('has no emoji greeting', (tester) async {
    await pumpThemed(
      tester,
      HomeHeader(user: null, unreadCount: 0, onNotificationTap: () {}),
    );

    final texts = tester.widgetList<Text>(find.byType(Text));
    for (final text in texts) {
      expect(text.data ?? '', isNot(contains('👋')));
    }
  });

  testWidgets('notification bell calls back when tapped', (tester) async {
    var taps = 0;
    await pumpThemed(
      tester,
      HomeHeader(user: null, unreadCount: 3, onNotificationTap: () => taps++),
    );

    await tester.tap(find.byIcon(Icons.notifications_none_rounded));
    expect(taps, 1);
  });
}
