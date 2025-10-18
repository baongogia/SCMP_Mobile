import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/config";
import { showErrorToast } from "./errorHandler";

export const storage = {
  async setItem(key: string, value: any): Promise<void> {
    try {
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi lưu trữ",
        message: `Không thể lưu ${key}`,
      });
      throw error;
    }
  },

  async getItem<T = any>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;

      try {
        return JSON.parse(value);
      } catch {
        return value as T;
      }
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi lấy dữ liệu",
        message: `Không thể lấy ${key}`,
      });
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi xóa dữ liệu",
        message: `Không thể xóa ${key}`,
      });
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi xóa storage",
        message: "Không thể xóa toàn bộ storage",
      });
      throw error;
    }
  },

  async getAllKeys(): Promise<string[]> {
    try {
      return [...(await AsyncStorage.getAllKeys())];
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi lấy keys",
        message: "Không thể lấy danh sách keys",
      });
      return [];
    }
  },

  // Convenience methods for common storage operations
  async setUser(user: any): Promise<void> {
    return this.setItem(STORAGE_KEYS.USER, user);
  },

  async getUser(): Promise<any | null> {
    return this.getItem(STORAGE_KEYS.USER);
  },

  async setToken(token: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.LOGIN_TOKEN, token);
  },

  async getToken(): Promise<string | null> {
    return this.getItem<string>(STORAGE_KEYS.LOGIN_TOKEN);
  },

  async setTenant(tenant: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.TENANT, tenant);
  },

  async getTenant(): Promise<string | null> {
    return this.getItem<string>(STORAGE_KEYS.TENANT);
  },

  async clearAuth(): Promise<void> {
    await Promise.all([
      this.removeItem(STORAGE_KEYS.LOGIN_TOKEN),
      this.removeItem(STORAGE_KEYS.USER),
    ]);
  },
};
