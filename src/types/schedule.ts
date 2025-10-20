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
export interface ClassStudent {
  featured_image: any;
  username: string;
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  status?: string;
}

export interface ClassCourse {
  session_number: number;
  session_number_duration: string;
  _id: string;
  title: string;
  description: string;
  level: string;
  duration: number;
  price: number;
}

export interface ClassItem {
  _id: string;
  name: string;
  course: ClassCourse;
  member: ClassStudent[];
  instructor: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
  schedule_id?: string; // Class-schedule ID for attendance
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
