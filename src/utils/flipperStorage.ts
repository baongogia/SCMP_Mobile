import AsyncStorage from "@react-native-async-storage/async-storage";
import { logStorageOperation } from "../config/flipper";
import { showErrorToast } from "./errorHandler";

// Wrapper for AsyncStorage with Flipper logging
export const flipperStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      logStorageOperation("GET", key, value);
      return value;
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi lấy dữ liệu",
        message: `Không thể lấy ${key}`,
      });
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
      logStorageOperation("SET", key, value);
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi lưu dữ liệu",
        message: `Không thể lưu ${key}`,
      });
      throw error;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      logStorageOperation("REMOVE", key);
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
      logStorageOperation("CLEAR", "all");
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
      const keys = await AsyncStorage.getAllKeys();
      logStorageOperation("GET_ALL_KEYS", "all", keys);
      return keys;
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi lấy keys",
        message: "Không thể lấy danh sách keys",
      });
      return [];
    }
  },

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      const result = await AsyncStorage.multiGet(keys);
      logStorageOperation("MULTI_GET", keys.join(","), result);
      return result;
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi lấy nhiều dữ liệu",
        message: "Không thể lấy nhiều dữ liệu",
      });
      return [];
    }
  },

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
      logStorageOperation(
        "MULTI_SET",
        keyValuePairs.map(([key]) => key).join(","),
        keyValuePairs
      );
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi lưu nhiều dữ liệu",
        message: "Không thể lưu nhiều dữ liệu",
      });
      throw error;
    }
  },

  async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
      logStorageOperation("MULTI_REMOVE", keys.join(","));
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi xóa nhiều dữ liệu",
        message: "Không thể xóa nhiều dữ liệu",
      });
      throw error;
    }
  },
};
