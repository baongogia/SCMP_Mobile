import { useState, useEffect, useCallback } from "react";
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
  const [accentColor, setAccentColor] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const generateAccentColor = (path: string | null) => {
    if (!path) {
      return "#2563eb"; // Default blue
    }

    // For avatar with water/blue theme, use blue colors
    const blueColors = [
      "#1e40af", // Blue-800
      "#2563eb", // Blue-600
      "#3b82f6", // Blue-500
      "#1d4ed8", // Blue-700
      "#1e3a8a", // Blue-900
    ];

    // Use a simple hash to pick a consistent blue color
    let hash = 0;
    for (let i = 0; i < path.length; i++) {
      hash = path.charCodeAt(i) + ((hash << 5) - hash);
      hash |= 0;
    }
    const colorIndex = Math.abs(hash) % blueColors.length;
    return blueColors[colorIndex];
  };

  const loadUserInfo = useCallback(async () => {
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
        // Generate accent color based on avatar
        const accent = generateAccentColor(uri);
        setAccentColor(accent);
      } else {
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserInfo = async (newUserInfo: UserInfo) => {
    try {
      await AsyncStorage.setItem("user", JSON.stringify(newUserInfo));
      setUserInfo(newUserInfo);
      const uri = Array.isArray(newUserInfo?.featured_image)
        ? newUserInfo?.featured_image?.[0]?.path || null
        : (newUserInfo as any)?.featured_image?.path || null;
      setAvatarUri(uri);

      // Update accent color when user info changes
      const accent = generateAccentColor(uri);
      setAccentColor(accent);

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
      setAccentColor("#2563eb"); // Reset to default blue
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
  }, [loadUserInfo]);

  return {
    userInfo,
    avatarUri,
    accentColor,
    loading,
    loadUserInfo,
    updateUserInfo,
    clearUserInfo,
  };
};
