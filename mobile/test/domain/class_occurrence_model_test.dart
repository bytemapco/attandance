import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/domain/models/class_occurrence.dart';

void main() {
  group('ClassOccurrenceModel Tests', () {
    test('Correctly deserializes from JSON', () {
      final json = {
        'id': 'occ-101',
        'tenant_id': 'tenant-test',
        'course_section_id': 'sec-01',
        'date': '2025-09-01',
        'time_slot_id': 'slot-01',
        'course_name': 'Data Structures',
        'subject_code': 'CS201',
        'section_name': 'Section A',
        'classroom_name': 'Room 301',
        'faculty_name': 'Dr. Sharma',
        'start_time': '09:00',
        'end_time': '10:00',
        'status': 'CONDUCTED',
        'is_attendance_locked': false,
        'present_count': 45,
        'total_enrolled': 50,
      };

      final model = ClassOccurrenceModel.fromJson(json);

      expect(model.id, 'occ-101');
      expect(model.courseName, 'Data Structures');
      expect(model.isConducted, isTrue);
      expect(model.isScheduled, isFalse);
      expect(model.presentCount, 45);
      expect(model.totalEnrolled, 50);
    });

    test('Correctly handles default values when fields are missing', () {
      final model = ClassOccurrenceModel.fromJson({});

      expect(model.id, '');
      expect(model.courseName, 'Class');
      expect(model.isScheduled, isTrue);
      expect(model.isConducted, isFalse);
      expect(model.presentCount, 0);
    });
  });
}
