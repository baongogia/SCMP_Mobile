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

export interface ScheduleItem {
  _id: string;
  slot: ScheduleSlot;
  date: string;
  classroom: ScheduleClassroom;
  pool: SchedulePool;
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
