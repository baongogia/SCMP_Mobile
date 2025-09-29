export interface Course {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  level: "beginner" | "intermediate" | "advanced";
  category: string;
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  schedule: CourseSchedule[];
  maxStudents: number;
  currentStudents: number;
  status: "active" | "inactive" | "full";
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseSchedule {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  location: string;
}

export interface CourseCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface CourseOrder {
  id: string;
  courseId: string;
  userId: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  totalAmount: number;
  orderDate: string;
  paymentDate?: string;
}

export interface PaymentHistory {
  id: string;
  orderId: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
}
