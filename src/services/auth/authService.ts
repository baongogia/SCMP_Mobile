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

const extractProfilePayload = (payload: any) => {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0] || null;
  if (Array.isArray(payload?.data)) return payload.data[0] || null;
  return payload;
};

const refreshCurrentUserFromAPI = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.MEMBER.PROFILE);
    const profile = extractProfilePayload(response.data?.data);
    if (profile) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
      try {
        eventBus.emit("user:updated", profile);
      } catch {}
    }
    return profile;
  } catch (error) {
    console.error("❌ [authService] Failed to refresh user profile:", error);
    throw error;
  }
};

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

  async switchToChildAccount(
    childId: string,
    childName: string
  ): Promise<{ success: boolean }> {
    try {
      // Get current token and save as parent token
      const currentToken = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TOKEN);
      if (!currentToken) {
        throw new Error("No current token found");
      }
      await AsyncStorage.setItem(STORAGE_KEYS.PARENT_TOKEN, currentToken);

      // Preserve current user info to restore later
      const parentUserRaw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (parentUserRaw) {
        await AsyncStorage.setItem(STORAGE_KEYS.PARENT_USER, parentUserRaw);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.PARENT_USER);
      }

      // Get child token
      const response = await getChildToken(childId);
      const result = response.data;

      console.log(
        "🔑 [switchToChildAccount] Response structure:",
        JSON.stringify(result, null, 2)
      );

      // Response structure: { data: "token", message: "Success", statusCode: 200 }
      // So: result = response.data = { data: "token", message: "Success", statusCode: 200 }
      // Token is directly in result.data (as a string)
      if (!result || result.statusCode !== 200 || !result.data) {
        console.error("❌ [switchToChildAccount] Invalid response:", {
          result,
        });
        throw new Error("Failed to get child token");
      }

      // Store child token (result.data is the token string directly)
      const childToken = result.data;
      console.log(
        "🔑 [switchToChildAccount] Storing child token:",
        childToken.substring(0, 20) + "..."
      );
      await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, childToken);

      // Verify token was stored
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TOKEN);
      console.log(
        "✅ [switchToChildAccount] Token stored successfully:",
        storedToken ? storedToken.substring(0, 20) + "..." : "null"
      );

      // Store child account info
      const childInfo = {
        id: childId,
        name: childName,
      };
      await AsyncStorage.setItem(
        STORAGE_KEYS.CHILD_ACCOUNT_INFO,
        JSON.stringify(childInfo)
      );

      // Fetch and store child profile info
      try {
        await refreshCurrentUserFromAPI();
      } catch (profileError) {
        console.error(
          "❌ [switchToChildAccount] Failed to load child profile:",
          profileError
        );
      }

      // Emit event
      try {
        eventBus.emit("auth:switch-to-child", childInfo);
        eventBus.emit("auth:token-switched");
      } catch {}

      return { success: true };
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi chuyển đổi tài khoản",
        message: "Không thể chuyển sang tài khoản con",
      });
      throw error;
    }
  },

  async switchBackToParentAccount(): Promise<{ success: boolean }> {
    try {
      console.log("🔄 [switchBackToParentAccount] Starting...");

      // Get parent token
      const parentToken = await AsyncStorage.getItem(STORAGE_KEYS.PARENT_TOKEN);
      console.log(
        "🔑 [switchBackToParentAccount] Parent token found:",
        parentToken ? parentToken.substring(0, 20) + "..." : "null"
      );

      if (!parentToken) {
        throw new Error("No parent token found");
      }

      // Restore parent token
      await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, parentToken);
      console.log("✅ [switchBackToParentAccount] Parent token restored");

      // Restore parent user info if available, otherwise refetch
      const parentUserRaw = await AsyncStorage.getItem(
        STORAGE_KEYS.PARENT_USER
      );
      if (parentUserRaw) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, parentUserRaw);
        try {
          eventBus.emit("user:updated", JSON.parse(parentUserRaw));
        } catch {}
      } else {
        try {
          await refreshCurrentUserFromAPI();
        } catch (profileError) {
          console.error(
            "❌ [switchBackToParentAccount] Failed to restore parent profile:",
            profileError
          );
        }
      }

      // Clear parent token, cached parent user and child account info
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PARENT_TOKEN,
        STORAGE_KEYS.PARENT_USER,
        STORAGE_KEYS.CHILD_ACCOUNT_INFO,
      ]);
      console.log("🧹 [switchBackToParentAccount] Cleared child account info");

      // Emit event
      try {
        eventBus.emit("auth:switch-to-parent");
        eventBus.emit("auth:token-switched");
        console.log("📢 [switchBackToParentAccount] Event emitted");
      } catch {}

      return { success: true };
    } catch (error) {
      console.error("❌ [switchBackToParentAccount] Error:", error);
      showErrorToast(error, {
        title: "Lỗi chuyển đổi tài khoản",
        message: "Không thể quay về tài khoản chính",
      });
      throw error;
    }
  },

  async isViewingChildAccount(): Promise<boolean> {
    try {
      const childInfo = await AsyncStorage.getItem(
        STORAGE_KEYS.CHILD_ACCOUNT_INFO
      );
      return !!childInfo;
    } catch (error) {
      return false;
    }
  },

  async getChildAccountInfo(): Promise<{ id: string; name: string } | null> {
    try {
      const childInfoString = await AsyncStorage.getItem(
        STORAGE_KEYS.CHILD_ACCOUNT_INFO
      );
      if (!childInfoString) return null;
      return JSON.parse(childInfoString);
    } catch (error) {
      return null;
    }
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

export const postMedia = (data: {
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

export const getChildToken = (child_id: string) => {
  return api.post(`/v1/auth/get-child-account-token/${child_id}`);
};
