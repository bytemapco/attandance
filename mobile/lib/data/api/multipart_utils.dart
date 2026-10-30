import 'dart:io';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart' as p;

Future<MultipartFile?> buildDocumentMultipartFile(String? documentPath) async {
  if (documentPath == null || documentPath.isEmpty) return null;
  final ext = p.extension(documentPath).toLowerCase();
  final filename = p.basename(documentPath);
  MediaType mediaType;
  if (ext == '.png') {
    mediaType = MediaType('image', 'png');
  } else if (ext == '.pdf') {
    mediaType = MediaType('application', 'pdf');
  } else if (ext == '.webp') {
    mediaType = MediaType('image', 'webp');
  } else {
    mediaType = MediaType('image', 'jpeg');
  }
  return MultipartFile.fromFile(
    documentPath,
    filename: filename,
    contentType: mediaType,
  );
}

Future<FormData> buildAttendanceFormData({
  required String sessionId,
  required double latitude,
  required double longitude,
  required double accuracy,
  required String imagePath,
}) async {
  final Map<String, dynamic> formDataMap = {
    'session_id': sessionId,
    'latitude': latitude.toString(),
    'longitude': longitude.toString(),
    'accuracy': accuracy.toString(),
  };

  if (File(imagePath).existsSync()) {
    formDataMap['image'] = await MultipartFile.fromFile(
      imagePath,
      contentType: MediaType('image', 'jpeg'),
    );
  }

  return FormData.fromMap(formDataMap);
}
