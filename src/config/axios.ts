import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../constants/config";
import { logNetworkRequest } from "./flipper";
import { eventBus } from "@/src/utils/eventBus";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.API_ENDPOINT,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token and tenant ID
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem("loginToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Get tenant ID from AsyncStorage
      const tenantData = await AsyncStorage.getItem("tenant");
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
          console.error("Error processing tenant data:", error);
        }
      }

      // Log network request for debugging
      logNetworkRequest(
        config.url || "",
        config.method?.toUpperCase() || "GET",
        config.data
      );
    } catch (error) {
      console.error("Error in request interceptor:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
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
      try {
        await AsyncStorage.multiRemove(["loginToken", "user", "tenant"]);
      } catch (storageError) {
        console.error("Error clearing storage:", storageError);
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
  ): Promise<AxiosResponse<T>> => apiClient.get(url, config),

  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => apiClient.post(url, data, config),

  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => apiClient.put(url, data, config),

  delete: <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => apiClient.delete(url, config),

  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => apiClient.patch(url, data, config),
};

export default apiClient;
