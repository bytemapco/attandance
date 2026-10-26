import 'package:flutter_test/flutter_test.dart';
import 'package:smart_attendance_app/domain/models/leave_request.dart';

void main() {
  group('LeaveRequest Model', () {
    test('parses json with all fields', () {
      final json = {
        'id': 'leave-1',
        'student_id': 'stu-1',
        'student_name': 'Bob Smith',
        'enrollment_number': 'ENR-001',
        'start_date': '2026-10-27T00:00:00Z',
        'end_date': '2026-10-29T00:00:00Z',
        'reason': 'Medical Emergency with doctor note',
        'document_url': 'https://s3.aws.com/doc.pdf',
        'status': 'PENDING',
        'approved_by': null,
        'approver_note': null,
        'created_at': '2026-10-26T08:00:00Z',
        'updated_at': '2026-10-26T08:00:00Z',
      };

      final leave = LeaveRequest.fromJson(json);

      expect(leave.id, 'leave-1');
      expect(leave.studentName, 'Bob Smith');
      expect(leave.status, 'PENDING');
      expect(leave.documentUrl, isNotNull);
      expect(leave.startDate.day, 27);
      expect(leave.endDate.day, 29);
    });

    test('LeaveRequestListResponse parses aggregated leave list', () {
      final json = {
        'leaves': [
          {
            'id': 'leave-1',
            'student_id': 'stu-1',
            'student_name': 'Bob Smith',
            'enrollment_number': 'ENR-001',
            'start_date': '2026-10-27T00:00:00Z',
            'end_date': '2026-10-29T00:00:00Z',
            'reason': 'Medical leave',
            'status': 'APPROVED',
            'created_at': '2026-10-26T08:00:00Z',
            'updated_at': '2026-10-26T08:00:00Z',
          }
        ],
        'total': 1,
        'pending': 0,
        'approved': 1,
        'rejected': 0,
      };

      final listResponse = LeaveRequestListResponse.fromJson(json);

      expect(listResponse.total, 1);
      expect(listResponse.approved, 1);
      expect(listResponse.leaves.length, 1);
      expect(listResponse.leaves.first.status, 'APPROVED');
    });
  });
}
