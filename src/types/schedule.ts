export interface ScheduleSlot {
  _id: string;
  title: string;
  start_time: number;
  end_time: number;
  duration: string;
  start_minute: number;
  end_minute: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
}

export interface ScheduleClassroom {
  _id: string;
  name: string;
  course: string;
  member: string[];
  instructor: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
}

export interface SchedulePool {
  _id: string;
  title: string;
  type: string;
  dimensions: string;
  depth: string;
  capacity: number;
  maintance_status: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
}

export interface ScheduleAttendee {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  status?: string;
}

export interface ScheduleItem {
  _id: string;
  slot: ScheduleSlot;
  date: string;
  classroom: ScheduleClassroom;
  pool: SchedulePool;
  attendees?: string[]; // Array of student IDs
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
}

export interface ScheduleResponse {
  data: ScheduleItem[];
  message: string;
  statusCode: number;
}

export interface ScheduleDetailResponse {
  data: ScheduleItem[];
  message: string;
  statusCode: number;
}

// Class/Course related types
export interface AgeConfig {
  _id: string;
  title: string;
  age_range: number[];
}

export interface ClassStudent {
  featured_image: any;
  username: string;
  _id: string;
  name: string;
  email: string;
  phone: string;
  birthday?: string;
  parent_id?: string | string[] | null;
  role_front?: string[];
  avatar?: string;
  status?: string;
}

export interface CourseEvaluationField {
  type: string;
  required?: boolean;
  is_filter?: boolean;
  entity?: string;
  relation_type?: string;
}

export interface CourseEvaluationForm {
  type: string;
  items: Record<string, CourseEvaluationField>;
}


export interface CourseDetailSection {
  title: string;
  description?: string;
  form_judge?: CourseEvaluationForm;
}

export interface ClassSchedulePlan {
  days_of_week: string[];
  slot?: string;
  location?: string;
}

export interface ClassCourse {
  _id: string;
  title: string;
  description: string;
  price: number;
  session_number?: number;
  session_number_duration?: string;
  level?: string;
  duration?: number;
  slug?: string;
  media?: any[];
  detail?: CourseDetailSection[];
  category?: string[];
  is_active?: boolean;
  type_of_age?: AgeConfig[];
}

export interface ClassItem {
  _id: string;
  name: string;
  course: ClassCourse;
  member: ClassStudent[];
  instructor: string;
  created_at: string;
  created_by: string;
  start_date?: string;
  end_date?: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
  schedule_id?: string;
  schedule_plan?: ClassSchedulePlan[];
  show_on_regist_course?: boolean;

  // New API fields
  session_number?: number;
  session_number_duration?: string;
  max_member?: number;
  detail?: CourseDetailSection[];
  type?: string | string[];
  type_of_age?: string[] | AgeConfig[];
}

export interface ClassResponse {
  data: {
    data: ClassItem[];
    message: string;
    statusCode: number;
  };
  status: number;
}

export interface ClassDetailResponse {
  data: {
    data: ClassItem[];
    message: string;
    statusCode: number;
  };
  status: number;
}

export interface AttendanceData {
  attendees: string[]; // Array of student IDs who attended
}
