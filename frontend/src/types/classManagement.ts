export interface ClassSummary {
  id: string;
  code: string;
  department_id: string;
  department_name: string;
  batch: string;
  semester_number: number;
  member_count: number;
  subject_count: number;
  status: string;
  created_at: string;
}

export interface ClassMemberItem {
  student_id: string;
  enrollment_number: string;
  name: string;
  status: string;
}

export interface ScheduleItem {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_name?: string | null;
}

export interface ClassSectionItem {
  id: string;
  name: string;
  subject_id: string;
  subject_name?: string | null;
  subject_code?: string | null;
  teacher_id?: string | null;
  teacher_name?: string | null;
  room_name?: string | null;
  enrolled_count: number;
  schedule: ScheduleItem[];
}

export interface ClassDetail extends ClassSummary {
  members: ClassMemberItem[];
  sections: ClassSectionItem[];
}
