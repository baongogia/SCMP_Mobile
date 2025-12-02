import { api } from "@/src/config/axios";
import { API_ENDPOINTS } from "@/src/constants/config";
import {
  Course,
  CourseCategory,
  CourseOrder,
  PaymentHistory,
  ApiResponse,
  PaginationParams,
} from "@/src/types";
import { showErrorToast } from "@/src/utils/errorHandler";

export const courseService = {
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
      showErrorToast(error, {
        title: "Lỗi tải khóa học",
        message: "Không thể tải danh sách khóa học",
      });
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
      showErrorToast(error, {
        title: "Lỗi tải lịch học",
        message: "Không thể tải lịch học",
      });
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
      showErrorToast(error, {
        title: "Lỗi tải lịch sử thanh toán",
        message: "Không thể tải lịch sử thanh toán",
      });
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
      showErrorToast(error, {
        title: "Lỗi đăng ký khóa học",
        message: "Không thể đăng ký khóa học",
      });
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
      showErrorToast(error, {
        title: "Lỗi tải khóa học công khai",
        message: "Không thể tải danh sách khóa học",
      });
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
      showErrorToast(error, {
        title: "Lỗi tải chi tiết khóa học",
        message: "Không thể tải thông tin khóa học",
      });
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
      showErrorToast(error, {
        title: "Lỗi tải danh mục",
        message: "Không thể tải danh mục khóa học",
      });
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
      showErrorToast(error, {
        title: "Lỗi tải cơ sở",
        message: "Không thể tải danh sách cơ sở",
      });
      throw error;
    }
  },
};

export const getAllCourses = () => {
  return api.get("/v1/workflow-process/mobile/courses");
};

export const getCourseDetail = (courseId: string) => {
  return api.get(`/v1/workflow-process/public/course?id=${courseId}`);
};

export const getMemberLearningProgress = () => {
  return api.get("/v1/workflow-process/mobile/class/learning/progress");
};

export const getClassroomLearningProgress = (classId: string) => {
  return api.get(
    `/v1/workflow-process/mobile/class/learning/progress?class_id=${classId}`
  );
};

export const getClassByCourseId = (courseId: string) => {
  return api.get(
    `/v1/workflow-process/mobile/class-by-course?course_id=${courseId}`
  );
};
