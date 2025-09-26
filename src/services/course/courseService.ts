import { api } from "../../config/axios";
import { API_ENDPOINTS } from "../../constants/config";
import {
  Course,
  CourseCategory,
  CourseOrder,
  PaymentHistory,
  ApiResponse,
  PaginationParams,
} from "../../types";

export const courseService = {
  // Member course services
  async getMemberCourses(
    tenant: string,
    params?: PaginationParams
  ): Promise<ApiResponse<Course[]>> {
    try {
      const response = await api.get<ApiResponse<Course[]>>(
        API_ENDPOINTS.MEMBER.COURSES,
        {
          headers: {
            "x-tenant-id": tenant,
          },
          params,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching member courses:", error);
      throw error;
    }
  },

  async getMemberSchedule(
    tenant: string,
    params?: PaginationParams
  ): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get<ApiResponse<any[]>>(
        API_ENDPOINTS.MEMBER.SCHEDULE,
        {
          headers: {
            "x-tenant-id": tenant,
          },
          params,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching member schedule:", error);
      throw error;
    }
  },

  async getPaymentHistory(
    tenant: string,
    params?: PaginationParams
  ): Promise<ApiResponse<PaymentHistory[]>> {
    try {
      const response = await api.get<ApiResponse<PaymentHistory[]>>(
        API_ENDPOINTS.MEMBER.PAYMENT_HISTORY,
        {
          headers: {
            "x-tenant-id": tenant,
          },
          params,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching payment history:", error);
      throw error;
    }
  },

  async orderCourse(
    tenant: string,
    courseId: string
  ): Promise<ApiResponse<CourseOrder>> {
    try {
      const response = await api.post<ApiResponse<CourseOrder>>(
        API_ENDPOINTS.MEMBER.ORDER_COURSE,
        { courseId },
        {
          headers: {
            "x-tenant-id": tenant,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error ordering course:", error);
      throw error;
    }
  },

  // Public course services
  async getPublicCourses(
    params?: PaginationParams
  ): Promise<ApiResponse<Course[]>> {
    try {
      const response = await api.get<ApiResponse<Course[]>>(
        API_ENDPOINTS.PUBLIC.COURSES,
        { params }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching public courses:", error);
      throw error;
    }
  },

  async getPublicCourseDetail(courseId: string): Promise<ApiResponse<Course>> {
    try {
      const response = await api.get<ApiResponse<Course>>(
        `${API_ENDPOINTS.PUBLIC.COURSE_DETAIL}/${courseId}`
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching course detail:", error);
      throw error;
    }
  },

  async getCourseCategories(): Promise<ApiResponse<CourseCategory[]>> {
    try {
      const response = await api.get<ApiResponse<CourseCategory[]>>(
        API_ENDPOINTS.PUBLIC.COURSE_CATEGORIES
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching course categories:", error);
      throw error;
    }
  },

  async getAvailableTenants(): Promise<{ data: any[] }> {
    try {
      const endpoint = API_ENDPOINTS.AUTH.TENANTS_AVAILABLE;
      const response = await api.get<any>(endpoint);
      const payload = response.data;

      let tenants: any[] = [];
      if (payload && Array.isArray(payload.data)) {
        const arr: any[] = payload.data;
        tenants = Array.isArray(arr[0]) ? arr.flat() : arr;
      } else if (Array.isArray(payload)) {
        tenants = Array.isArray(payload[0])
          ? (payload as any[]).flat()
          : payload;
      }

      return { data: tenants };
    } catch (error) {
      console.error("Error fetching available tenants:", error);
      throw error;
    }
  },
};

export const getAllCourses = () => {
  return api.get("/v1/workflow-process/mobile/courses");
};

export const getMemberLearningProgress = () => {
  return api.get("/v1/workflow-process/mobile/member/learning/progress");
};
