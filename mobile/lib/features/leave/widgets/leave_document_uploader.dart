import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:smart_attendance_app/app/theme.dart';

class LeaveDocumentUploader extends StatelessWidget {
  final File? selectedDocument;
  final ValueChanged<ImageSource> onPick;
  final VoidCallback onClear;

  const LeaveDocumentUploader({
    super.key,
    required this.selectedDocument,
    required this.onPick,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Supporting Documentation (Optional)',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 13,
            color: SasColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        if (selectedDocument != null) ...[
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.file(
                  selectedDocument!,
                  height: 120,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
              Positioned(
                top: 6,
                right: 6,
                child: GestureDetector(
                  onTap: onClear,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.black54,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.close_rounded,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ] else ...[
          Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: () => onPick(ImageSource.gallery),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      color: SasColors.bgSecondary,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: SasColors.glassBorder),
                    ),
                    child: const Column(
                      children: [
                        Icon(
                          Icons.photo_library_outlined,
                          color: SasColors.textMuted,
                          size: 22,
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Upload Image',
                          style: TextStyle(
                            color: SasColors.textSecondary,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: InkWell(
                  onTap: () => onPick(ImageSource.camera),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      color: SasColors.bgSecondary,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: SasColors.glassBorder),
                    ),
                    child: const Column(
                      children: [
                        Icon(
                          Icons.camera_alt_outlined,
                          color: SasColors.textMuted,
                          size: 22,
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Take Photo',
                          style: TextStyle(
                            color: SasColors.textSecondary,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
