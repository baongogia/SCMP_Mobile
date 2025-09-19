import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/config";

export const storage = {
  async setItem(key: string, value: any): Promise<void> {
    try {
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
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
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
      throw error;
    }
  },

  async getAllKeys(): Promise<string[]> {
    try {
      return [...(await AsyncStorage.getAllKeys())];
    } catch (error) {
      console.error("Error getting all keys:", error);
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
