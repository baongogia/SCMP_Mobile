import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UserInfo {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  featured_image?: Array<{
    path: string;
    _id: string;
  }>;
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
        const uri = user?.featured_image?.[0]?.path || null;
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
      const uri = newUserInfo?.featured_image?.[0]?.path || null;
      setAvatarUri(uri);
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
