import 'dart:io';
import 'package:image/image.dart' as img;

class ImageQuality {
  final double brightness;
  final double blur;
  const ImageQuality({required this.brightness, required this.blur});
}

ImageQuality computeImageQuality(String imagePath) {
  try {
    final bytes = File(imagePath).readAsBytesSync();
    final image = img.decodeImage(bytes);
    if (image == null) return const ImageQuality(brightness: 0, blur: 0);

    final resized = img.copyResize(image, width: 100);
    double totalLuminance = 0;

    for (final p in resized) {
      final r = p.r / 255.0;
      final g = p.g / 255.0;
      final b = p.b / 255.0;
      totalLuminance += (0.299 * r + 0.587 * g + 0.114 * b);
    }
    double brightness = totalLuminance / (resized.width * resized.height);

    double sumVar = 0;
    double sumSq = 0;
    int count = 0;
    for (int y = 0; y < resized.height - 1; y++) {
      for (int x = 0; x < resized.width - 1; x++) {
        final p1 = resized.getPixel(x, y);
        final p2 = resized.getPixel(x + 1, y);
        final p3 = resized.getPixel(x, y + 1);

        final l1 = 0.299 * p1.r + 0.587 * p1.g + 0.114 * p1.b;
        final l2 = 0.299 * p2.r + 0.587 * p2.g + 0.114 * p2.b;
        final l3 = 0.299 * p3.r + 0.587 * p3.g + 0.114 * p3.b;

        final diffX = (l1 - l2) / 255.0;
        final diffY = (l1 - l3) / 255.0;
        final lap = diffX.abs() + diffY.abs();

        sumVar += lap;
        sumSq += lap * lap;
        count++;
      }
    }
    final mean = sumVar / count;
    final variance = (sumSq / count) - (mean * mean);

    return ImageQuality(brightness: brightness, blur: variance * 1000);
  } catch (e) {
    return const ImageQuality(brightness: 0, blur: 0);
  }
}
