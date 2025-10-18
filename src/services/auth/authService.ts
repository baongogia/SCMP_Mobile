import { api } from "@/src/config/axios";
import { eventBus } from "@/src/utils/eventBus";
import { API_ENDPOINTS, STORAGE_KEYS } from "@/src/constants/config";
import { LoginRequest, LoginResponse } from "@/src/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showErrorToast } from "@/src/utils/errorHandler";

// Interface for actual API response structure
interface LoginApiResponse {
  data: {
    refreshToken: any;
    accessToken: string;
    user: any;
  };
  message: string;
  statusCode: number;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginApiResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      const result = response.data;

      if (result.statusCode !== 200) {
        throw new Error("Login failed");
      }

      // Store token and user data
      await AsyncStorage.setItem(
        STORAGE_KEYS.LOGIN_TOKEN,
        result.data.accessToken
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER,
        JSON.stringify(result.data.user)
      );

      // Store refresh token if available
      if (result.data.refreshToken) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.REFRESH_TOKEN,
          result.data.refreshToken
        );
      }

      // Notify app layers about successful login
      try {
        eventBus.emit("auth:login", result.data.user);
      } catch {}

      return {
        data: result.data,
        message: result.message,
        success: true,
      };
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi đăng nhập",
        message: "Không thể đăng nhập",
      });
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi đăng xuất",
        message: "Có lỗi khi đăng xuất",
      });
    } finally {
      // Clear stored data regardless of API call success
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.LOGIN_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
        STORAGE_KEYS.TENANT,
      ]);

      // Notify app layers about logout
      try {
        eventBus.emit("auth:logout");
      } catch {}
    }
  },

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TOKEN);
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi lấy token",
        message: "Không thể lấy token đã lưu",
      });
      return null;
    }
  },

  async getStoredUser(): Promise<any | null> {
    try {
      const userString = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi lấy thông tin người dùng",
        message: "Không thể lấy thông tin người dùng đã lưu",
      });
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  },
};

export const logout = () => {
  return api.get(API_ENDPOINTS.AUTH.LOGOUT);
};

export const getMemberProfile = () => {
  return api.get(API_ENDPOINTS.MEMBER.PROFILE);
};

export const getInstructorProfile = () => {
  return api.get("/v1/workflow-process/mobile/instructor/profile");
};

export const updateMemberProfile = (data: any) => {
  return api.put(API_ENDPOINTS.MEMBER.PROFILE, data);
};

export const updateInstructorProfile = (data: any) => {
  return api.put("/v1/workflow-process/mobile/instructor/profile", data);
};

export const changePassword = (data: any) => {
  return api.put(API_ENDPOINTS.MEMBER.CHANGE_PASSWORD, data);
};

export const addImageToProfile = (data: {
  title: string;
  alt: string;
  file: {
    uri: string;
    type: string;
    name: string;
  };
}) => {
  const formData = new FormData();

  formData.append("media[0][title]", data.title);
  formData.append("media[0][alt]", data.alt);

  formData.append("media[0][file]", {
    uri: data.file.uri,
    type: data.file.type,
    name: data.file.name,
  } as any);

  return api.post("/v1/media/public", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getPusherAuth = (socketId: string, channelName: string) => {
  return api.post("/v1/pusher/auth", {
    socketId,
    channelName,
  });
};
