export interface ScheduleItem {
  _id: string;
  date: string;
  slot: {
    start_time: number;
    start_minute: number;
    end_time?: number;
    end_minute?: number;
    title?: string | { name: string };
  };
  classroom: {
    _id: string;
    name: string | { name: string };
    course: string | { _id: string; title?: string; name?: string };
    member?: any[];
  };
  pool?: {
    _id: string;
    name: string;
  };
  instructor?: string;
  attendees?: string[];
}

export interface Student {
  _id: string;
  username?: string;
  name?: string;
  email?: string;
  featured_image?: Array<{ path: string }>;
}

export interface RouteParams {
  scheduleId?: string;
  schedule?: ScheduleItem;
}

