export interface Note {
  _id: string;
  note: string;
  created_at: string;
  updated_at: string;
  media?: any[];
  member?: {
    _id: string;
    name?: string;
    username?: string;
    email?: string;
    featured_image?: {
      _id?: string;
      path?: string;
      title?: string;
      alt?: string;
    }[];
  };
  schedule?: {
    _id: string;
    date: string;
    classroom: string;
    instructor: string;
    slot: any;
  };
  evaluation?: Record<string, number>;
}

export interface ScheduleItem {
  _id: string;
  date: string;
  slot?: any;
  classroom?: string;
  instructor?: string;
}

export interface RouteParams {
  class_id: string;
  course_id: string;
  class_name?: string;
  course_title?: string;
  schedule_id?: string;
  schedule_title?: string;
}

export interface Student {
  _id: string;
  name: string;
  email: string;
}

export interface MediaItem {
  id: string;
  uri: string;
  type: string;
  name: string;
  preview?: string;
  path?: string; // Added for consistency with API responses
}
