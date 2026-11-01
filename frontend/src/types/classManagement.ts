export interface ClassSummary {
  id: string;
  code: string;
  group_id: string;
  department_id: string;
  department_name: string;
  batch: string;
  semester_number: number;
  academic_year_id: string;
  academic_year_name: string;
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
  time_slot_id: string;
  slot_name?: string | null;
  start_time?: string | null;
  end_time?: string | null;
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

export interface PromotionPreview {
  dry_run: boolean;
  next_class_id?: string | null;
  next_semester_number?: number | null;
  promoted: number;
  detained: number;
  backlog_enrollments: number;
  graduated: boolean;
}
