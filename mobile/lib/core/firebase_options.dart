import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class DefaultFirebaseOptions {
  static const _envApiKey = String.fromEnvironment('FIREBASE_API_KEY');
  static const _envAppId = String.fromEnvironment('FIREBASE_APP_ID');
  static const _envProjectId = String.fromEnvironment('FIREBASE_PROJECT_ID');
  static const _envSenderId = String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID');
  static const _envAuthDomain = String.fromEnvironment('FIREBASE_AUTH_DOMAIN');
  static const _envStorageBucket = String.fromEnvironment('FIREBASE_STORAGE_BUCKET');

  static FirebaseOptions? get currentPlatform {
    final apiKey = _resolve(_envApiKey, 'FIREBASE_API_KEY');
    final appId = _resolve(_envAppId, 'FIREBASE_APP_ID');
    final projectId = _resolve(_envProjectId, 'FIREBASE_PROJECT_ID');
    final messagingSenderId = _resolve(_envSenderId, 'FIREBASE_MESSAGING_SENDER_ID');

    // If minimum required Firebase credentials are not provided, return null
    if (apiKey == null || appId == null || projectId == null) {
      return null;
    }

    final authDomain = _resolve(_envAuthDomain, 'FIREBASE_AUTH_DOMAIN') ??
        '$projectId.firebaseapp.com';
    final storageBucket = _resolve(_envStorageBucket, 'FIREBASE_STORAGE_BUCKET') ??
        '$projectId.appspot.com';

    if (kIsWeb) {
      return FirebaseOptions(
        apiKey: apiKey,
        appId: appId,
        messagingSenderId: messagingSenderId ?? '000000000000',
        projectId: projectId,
        authDomain: authDomain,
        storageBucket: storageBucket,
      );
    }

    if (Platform.isAndroid) {
      return FirebaseOptions(
        apiKey: apiKey,
        appId: appId,
        messagingSenderId: messagingSenderId ?? '000000000000',
        projectId: projectId,
        storageBucket: storageBucket,
      );
    }

    if (Platform.isIOS) {
      return FirebaseOptions(
        apiKey: apiKey,
        appId: appId,
        messagingSenderId: messagingSenderId ?? '000000000000',
        projectId: projectId,
        iosBundleId: 'com.smartattendance.smartAttendanceApp',
      );
    }

    return null;
  }

  static String? _resolve(String envDefine, String dotenvKey) {
    if (envDefine.trim().isNotEmpty) return envDefine.trim();
    if (dotenv.isInitialized) {
      final val = dotenv.env[dotenvKey];
      if (val != null && val.trim().isNotEmpty) return val.trim();
    }
    return null;
  }
}
