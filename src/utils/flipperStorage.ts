import AsyncStorage from "@react-native-async-storage/async-storage";
import { logStorageOperation } from "../config/flipper";

// Wrapper for AsyncStorage with Flipper logging
export const flipperStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      logStorageOperation("GET", key, value);
      return value;
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
      logStorageOperation("SET", key, value);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      throw error;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      logStorageOperation("REMOVE", key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      logStorageOperation("CLEAR", "all");
    } catch (error) {
      console.error("Error clearing storage:", error);
      throw error;
    }
  },

  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      logStorageOperation("GET_ALL_KEYS", "all", keys);
      return keys;
    } catch (error) {
      console.error("Error getting all keys:", error);
      return [];
    }
  },

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      const result = await AsyncStorage.multiGet(keys);
      logStorageOperation("MULTI_GET", keys.join(","), result);
      return result;
    } catch (error) {
      console.error("Error multi getting items:", error);
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
      console.error("Error multi setting items:", error);
      throw error;
    }
  },

  async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
      logStorageOperation("MULTI_REMOVE", keys.join(","));
    } catch (error) {
      console.error("Error multi removing items:", error);
      throw error;
    }
  },
};
