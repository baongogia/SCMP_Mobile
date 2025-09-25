export interface OrderUser {
  _id: string;
  email: string;
  username: string;
  password: string;
  role_system: string;
  role: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role_front: string[];
  parent_id: string[];
  featured_image: string[];
  updated_by: string;
}

export interface OrderCourse {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string[];
  session_number: number;
  session_number_duration: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  tenant_id: string;
  is_active: boolean;
  slug: string;
}

export interface OrderPayment {
  url: string;
  app_trans_id: string;
  zp_trans_id: string;
}

export interface OrderClass {
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
  order: string[];
}

export interface Order {
  _id: string;
  type: string[];
  course: OrderCourse;
  price: number;
  guest: any;
  user: OrderUser;
  created_at: string;
  created_by: string;
  tenant_id: string;
  status: string[];
  payment: OrderPayment;
  class: OrderClass;
  updated_at: string;
  updated_by: string;
}

export interface OrdersResponse {
  meta: {
    total: number;
    last_page: number;
    current_page: number;
  };
  data: Order[];
}
