export const API_CONFIG = {
  API_ENDPOINT:
    process.env.EXPO_PUBLIC_API_ENDPOINT ||
    "https://n4romoz0b1.execute-api.ap-southeast-1.amazonaws.com/dev/api",
  TIMEOUT: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || "30000", 10), // Increased from 10s to 30s
};

export const APP_CONFIG = {
  ENV: process.env.EXPO_PUBLIC_ENV || "development",
  DEBUG: process.env.EXPO_PUBLIC_DEBUG === "true" || false,
};

export const STORAGE_KEYS = {
  LOGIN_TOKEN: "loginToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
  TENANT: "tenant",
  SERVICE: "service",
};

export const WEATHER_CONFIG = {
  API_KEY:
    process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ||
    "e5c2d564f0e36c0acafaf3ab5503b65d",
  BASE_URL: "https://api.openweathermap.org/data/2.5",
  UNITS: "metric", // Celsius
  LANGUAGE: "vi", // Vietnamese
  REFRESH_INTERVAL: 10 * 60 * 1000, // 10 minutes in milliseconds
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/v1/auth/login",
    LOGOUT: "/v1/auth/logout",
    REFRESH: "/v1/auth/refresh",
    TENANTS_AVAILABLE: "/v1/workflow-process/tenants-available",
  },
  MEMBER: {
    PROFILE: "/v1/workflow-process/mobile/member/profile",
    CHANGE_PASSWORD: "/v1/workflow-process/mobile/member/change-password",
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
