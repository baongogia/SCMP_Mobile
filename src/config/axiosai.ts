import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG, STORAGE_KEYS } from "../constants/config";
import { logNetworkRequest } from "./flipper";
import { eventBus } from "@/src/utils/eventBus";
import { showErrorToast } from "@/src/utils/errorHandler";

// Create axios instance
const apiAIAgent: AxiosInstance = axios.create({
  baseURL: "https://nest-agent.duckdev.work/",
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    "api-key":
      process.env.EXPO_PUBLIC_API_KEY || "c56b59442c7611d1ccwexq3b55994bf8a0",
  },
});

// Request interceptor to add auth token and tenant ID
apiAIAgent.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Get tenant ID from AsyncStorage
      const tenantData = await AsyncStorage.getItem(STORAGE_KEYS.TENANT);
      if (tenantData && config.headers) {
        try {
          // Try to parse as JSON first, if it fails, use as string
          let tenantId = "";
          try {
            const tenant = JSON.parse(tenantData);
            tenantId = tenant.value || tenant._id || tenant.id || tenant || "";
          } catch (parseError) {
            // If parsing fails, use the raw string
            tenantId = tenantData;
          }
          if (tenantId) {
            config.headers["X-Tenant-ID"] = tenantId;
          }
        } catch (error) {
          showErrorToast(error, {
            title: "Lỗi xử lý dữ liệu cơ sở",
            message: "Không thể xử lý dữ liệu cơ sở",
          });
        }
      }

      // Log network request for debugging
      logNetworkRequest(
        config.url || "",
        config.method?.toUpperCase() || "GET",
        config.data
      );
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi interceptor",
        message: "Có lỗi trong request interceptor",
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiAIAgent.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses for debugging
    logNetworkRequest(
      response.config.url || "",
      response.config.method?.toUpperCase() || "GET",
      { status: response.status, data: response.data }
    );
    return response;
  },
  async (error) => {
    // Log error responses for debugging
    logNetworkRequest(
      error.config?.url || "",
      error.config?.method?.toUpperCase() || "GET",
      {
        status: error.response?.status,
        error: error.message,
        data: error.response?.data,
      }
    );

    const status = error.response?.status;
    const message: string | undefined =
      error.response?.data?.data?.message || error.response?.data?.message;

    const tokenExpired =
      status === 401 ||
      (status === 500 &&
        typeof message === "string" &&
        message.includes("jwt expired"));

    if (tokenExpired) {
      // Check if this is already a retry attempt
      const isRetry = error.config?._retry;

      if (!isRetry) {
        // Try to refresh token first
        try {
          const refreshToken = await AsyncStorage.getItem(
            STORAGE_KEYS.REFRESH_TOKEN
          );
          if (refreshToken) {
            console.log("🔄 Attempting to refresh token...");

            const refreshResponse = await axios.post(
              `${API_CONFIG.API_ENDPOINT}/v1/auth/refresh`,
              { refreshToken },
              { timeout: 15000 }
            );

            if (refreshResponse.data?.statusCode === 200) {
              const newToken = refreshResponse.data.data.accessToken;
              await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_TOKEN, newToken);

              // Retry the original request with new token
              error.config._retry = true;
              error.config.headers.Authorization = `Bearer ${newToken}`;

              console.log("✅ Token refreshed successfully, retrying request");
              return apiAIAgent.request(error.config);
            }
          }
        } catch (refreshError) {
          console.log("❌ Token refresh failed:", refreshError);
        }
      }

      // If refresh failed or no refresh token, clear storage and logout
      try {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.LOGIN_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER,
          STORAGE_KEYS.TENANT,
        ]);
      } catch (storageError) {
        showErrorToast(storageError, {
          title: "Lỗi xóa storage",
          message: "Không thể xóa dữ liệu lưu trữ",
        });
      } finally {
        eventBus.emit("auth:logout");
      }
    }
    return Promise.reject(error);
  }
);

// API wrapper with common methods
export const api = {
  get: <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => apiAIAgent.get(url, config),

  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => apiAIAgent.post(url, data, config),

  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => apiAIAgent.put(url, data, config),

  delete: <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => apiAIAgent.delete(url, config),

  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => apiAIAgent.patch(url, data, config),
};

export default apiAIAgent;
