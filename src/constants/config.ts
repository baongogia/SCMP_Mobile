export const API_CONFIG = {
  API_ENDPOINT: process.env.EXPO_PUBLIC_API_ENDPOINT,
  TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || "10000", 10),
};

export const APP_CONFIG = {
  ENV: process.env.EXPO_PUBLIC_ENV || "development",
  DEBUG: process.env.EXPO_PUBLIC_DEBUG === "true" || false,
};

export const STORAGE_KEYS = {
  LOGIN_TOKEN: "loginToken",
  USER: "user",
  TENANT: "tenant",
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/v1/auth/login",
    LOGOUT: "/v1/auth/logout",
    REFRESH: "/v1/auth/refresh",
    TENANTS_AVAILABLE: "/v1/workflow-process/tenants-available",
  },
  MEMBER: {
    COURSES: "/v1/workflow-process/member/courses",
    SCHEDULE: "/v1/workflow-process/member/schedule",
    PAYMENT_HISTORY: "/v1/workflow-process/member/payment-history",
    ORDER_COURSE: "/v1/workflow-process/member/order-course",
    CONVERSATIONS: "/v1/workflow-process/member/conversations",
    CONVERSATION: "/v1/workflow-process/member/conversation",
    TENANTS_AVAILABLE: "/v1/workflow-process/tenants-available",
  },
  INSTRUCTOR: {
    CONVERSATIONS: "/v1/workflow-process/instructor/conversations",
    CONVERSATION: "/v1/workflow-process/instructor/conversation",
  },
  PUBLIC: {
    COURSES: "/v1/public/courses",
    COURSE_DETAIL: "/v1/public/course-detail",
    COURSE_CATEGORIES: "/v1/public/course-categories",
    TENANTS_AVAILABLE: "/v1/public/tenants-available",
    UPLOAD_MEDIA: "/v1/public/upload-media",
  },
};
