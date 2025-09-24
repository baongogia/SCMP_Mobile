import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG } from "../constants/config";
import { logNetworkRequest } from "./flipper";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.API_ENDPOINT,
  timeout: 10000,
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
        const tenant = JSON.parse(tenantData);
        const tenantId = tenant.value || tenant || "";
        config.headers["X-Tenant-ID"] = tenantId;
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

    if (error.response?.status === 401) {
      // Handle unauthorized access
      try {
        await AsyncStorage.removeItem("loginToken");
        await AsyncStorage.removeItem("user");
        // You might want to redirect to login screen here
      } catch (storageError) {
        console.error("Error clearing storage:", storageError);
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
