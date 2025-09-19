import { api } from "../../config/axios";
import { API_ENDPOINTS, STORAGE_KEYS } from "../../constants/config";
import { LoginRequest, LoginResponse, ApiResponse } from "../../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Interface for actual API response structure
interface LoginApiResponse {
  data: {
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

      return {
        data: result.data,
        message: result.message,
        success: true,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear stored data regardless of API call success
      await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_TOKEN);
    } catch (error) {
      console.error("Error getting stored token:", error);
      return null;
    }
  },

  async getStoredUser(): Promise<any | null> {
    try {
      const userString = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error("Error getting stored user:", error);
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getStoredToken();
    return !!token;
  },
};
