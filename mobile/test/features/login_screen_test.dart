import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/domain/enums/auth_state.dart';
import 'package:smart_attendance_app/features/auth/providers/auth_provider.dart';
import 'package:smart_attendance_app/features/auth/screens/login_screen.dart';

class _FakeAuthNotifier extends StateNotifier<AuthStateData>
    implements AuthNotifier {
  _FakeAuthNotifier()
      : super(const AuthStateData(status: AuthStatus.unauthenticated));

  String? lastLoginUser;
  String? lastLoginPass;

  @override
  Future<void> login(String identifier, String password) async {
    lastLoginUser = identifier;
    lastLoginPass = password;
  }

  @override
  Future<void> checkInitialAuth() async {}

  @override
  Future<void> logout() async {
    state = const AuthStateData(status: AuthStatus.unauthenticated);
  }

  @override
  Future<void> logoutWithReason(String reason) async {
    state = AuthStateData(
      status: AuthStatus.unauthenticated,
      errorMessage: reason,
    );
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  testWidgets('LoginScreen full UI flow: validation, navigation and submit', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final fakeNotifier = _FakeAuthNotifier();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith((ref) => fakeNotifier),
        ],
        child: const MaterialApp(
          home: LoginScreen(),
        ),
      ),
    );

    // Initial step: Identifier input visible
    expect(find.text('Student ID or Email'), findsOneWidget);
    expect(find.text('Continue'), findsOneWidget);

    // Attempt continue without entering input -> trigger validation
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(find.text('Please enter your student ID or email'), findsOneWidget);

    // Enter student identifier
    await tester.enterText(
      find.byType(TextFormField),
      'aarav.sharma@yopmail.com',
    );
    await tester.pumpAndSettle();

    // Tap Continue -> advances to Password step
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    // Password step UI verification
    expect(find.text('Welcome Back!'), findsOneWidget);
    expect(find.text('aarav.sharma@yopmail.com'), findsOneWidget);
    expect(find.text('Sign In'), findsOneWidget);

    // Enter password and submit
    await tester.enterText(find.byType(TextFormField), 'Student@123456');
    await tester.pumpAndSettle();

    await tester.tap(find.text('Sign In'));
    await tester.pumpAndSettle();

    expect(fakeNotifier.lastLoginUser, equals('aarav.sharma@yopmail.com'));
    expect(fakeNotifier.lastLoginPass, equals('Student@123456'));
  });
}
