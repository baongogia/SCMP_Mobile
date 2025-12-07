import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eventBus } from "@/src/utils/eventBus";
import { getMemberProfile } from "@/src/services/auth/authService";
import { showErrorToast } from "@/src/utils/errorHandler";

export interface UserInfo {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  birthday?: string | null;
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
        let user = JSON.parse(userRaw);
        // If profile in storage is missing birthday, try to fetch the latest profile
        try {
          if (!user?.birthday) {
            const resp = await getMemberProfile();
            const payload = Array.isArray(resp.data?.data)
              ? resp.data?.data[0]
              : resp.data?.data || resp.data;
            if (payload) {
              user = payload;
              // Update storage and user info
              await AsyncStorage.setItem("user", JSON.stringify(user));
            }
          }
        } catch (err) {
          // If profile fetch fails, we silently ignore and fall back to cached user
          console.warn("[useUserInfo] Failed to refresh profile:", err);
        }
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
      showErrorToast(error, {
        title: "Lỗi tải thông tin người dùng",
        message: "Không thể tải thông tin người dùng",
      });
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
      showErrorToast(error, {
        title: "Lỗi cập nhật thông tin",
        message: "Không thể cập nhật thông tin người dùng",
      });
    }
  };

  const clearUserInfo = async () => {
    try {
      await AsyncStorage.removeItem("user");
      setUserInfo(null);
      setAvatarUri(null);
      setAccentColor("#2563eb"); // Reset to default blue
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi xóa thông tin",
        message: "Không thể xóa thông tin người dùng",
      });
    }
  };

  useEffect(() => {
    loadUserInfo();
    const unsubUserUpdated = eventBus.on("user:updated", () => {
      loadUserInfo();
    });

    // Listen for token switch events to refresh user data
    const unsubTokenSwitched = eventBus.on("auth:token-switched", () => {
      console.log("🔄 [useUserInfo] Token switched, reloading user info...");
      loadUserInfo();
    });

    return () => {
      unsubUserUpdated();
      unsubTokenSwitched();
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
