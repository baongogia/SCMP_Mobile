import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eventBus } from "@/src/utils/eventBus";

export interface UserInfo {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  featured_image?:
    | {
        path: string;
        _id: string;
      }[]
    | { path: string; _id: string };
  [key: string]: any;
}

export const useUserInfo = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserInfo = async () => {
    try {
      setLoading(true);
      const userRaw = await AsyncStorage.getItem("user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        setUserInfo(user);
        const uri = Array.isArray(user?.featured_image)
          ? user?.featured_image?.[0]?.path || null
          : user?.featured_image?.path || null;
        setAvatarUri(uri);
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserInfo = async (newUserInfo: UserInfo) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(newUserInfo));
      setUserInfo(newUserInfo);
      const uri = Array.isArray(newUserInfo?.featured_image)
        ? newUserInfo?.featured_image?.[0]?.path || null
        : (newUserInfo as any)?.featured_image?.path || null;
      setAvatarUri(uri);
      eventBus.emit("user:updated", newUserInfo);
    } catch (error) {
      console.error("Error updating user info:", error);
    }
  };

  const clearUserInfo = async () => {
    try {
      await AsyncStorage.removeItem("user");
      setUserInfo(null);
      setAvatarUri(null);
    } catch (error) {
      console.error("Error clearing user info:", error);
    }
  };

  useEffect(() => {
    loadUserInfo();
    const unsub = eventBus.on("user:updated", () => {
      loadUserInfo();
    });
    return () => {
      unsub();
    };
  }, []);

  return {
    userInfo,
    avatarUri,
    loading,
    loadUserInfo,
    updateUserInfo,
    clearUserInfo,
  };
};
