/**
 * Image URLs and assets management
 * Centralized location for all image links used in the application
 */

export const IMAGES = {
  LOGIN_BACKGROUND:
    "https://i.pinimg.com/originals/4f/12/38/4f1238e0034c722e6df49973007a2c82.jpg",
  PROFILE_BACKGROUND:
    "https://i.pinimg.com/736x/56/13/8e/56138ebb21e03791f86c843aec147596.jpg",
  SEARCH_BACKGROUND:
    "https://i.pinimg.com/1200x/27/7f/1e/277f1e98ad407a4cd638dd9cf5215873.jpg",
  WELCOME_BACKGROUND:
    "https://i.pinimg.com/1200x/f7/9e/88/f79e88852e415e92342c20e406de6288.jpg",
  LAYOUT_BACKGROUND:
    "https://i.pinimg.com/1200x/3e/12/7d/3e127d660c3233f20d1515737da7c0ca.jpg",
  CHAT_TAB_BACKGROUND:
    "https://i.pinimg.com/1200x/27/7f/1e/277f1e98ad407a4cd638dd9cf5215873.jpg",
  AI_CHAT_BACKGROUND:
    "https://i.pinimg.com/736x/8a/5e/31/8a5e310b59576e9e93fe025d63c83b96.jpg",
} as const;

// https://i.pinimg.com/736x/8a/5e/31/8a5e310b59576e9e93fe025d63c83b96.jpg
// https://i.pinimg.com/736x/1d/cc/b3/1dccb38f3c32567f6ab8a8201e8af9ad.jpg

// Local assets (if any)
export const LOCAL_IMAGES = {
  DEFAULT_AVATAR: require("@/assets/images/default-avatar.jpg"),
  ICON: require("@/assets/images/icon.png"),
  SPLASH_ICON: require("@/assets/images/splash-icon.png"),
  ADAPTIVE_ICON: require("@/assets/images/adaptive-icon.png"),
  FAVICON: require("@/assets/images/favicon.png"),
  REACT_LOGO: require("@/assets/images/react-logo.png"),
  PARTIAL_REACT_LOGO: require("@/assets/images/partial-react-logo.png"),
} as const;

// Image categories for better organization
export const IMAGE_CATEGORIES = {
  BACKGROUNDS: {
    LOGIN: IMAGES.LOGIN_BACKGROUND,
    PROFILE: IMAGES.PROFILE_BACKGROUND,
    SEARCH: IMAGES.SEARCH_BACKGROUND,
    WELCOME: IMAGES.WELCOME_BACKGROUND,
    LAYOUT: IMAGES.LAYOUT_BACKGROUND,
  },
  AVATARS: {
    DEFAULT: LOCAL_IMAGES.DEFAULT_AVATAR,
  },
  ICONS: {
    APP: LOCAL_IMAGES.ICON,
    SPLASH: LOCAL_IMAGES.SPLASH_ICON,
    ADAPTIVE: LOCAL_IMAGES.ADAPTIVE_ICON,
    FAVICON: LOCAL_IMAGES.FAVICON,
  },
  LOGOS: {
    REACT: LOCAL_IMAGES.REACT_LOGO,
    PARTIAL_REACT: LOCAL_IMAGES.PARTIAL_REACT_LOGO,
  },
} as const;

// Helper function to get image URL with fallback
export const getImageUrl = (
  imageKey: keyof typeof IMAGES,
  fallback?: string
): string => {
  return IMAGES[imageKey] || fallback || LOCAL_IMAGES.DEFAULT_AVATAR;
};

// Helper function to get background image
export const getBackgroundImage = (
  category: keyof typeof IMAGE_CATEGORIES.BACKGROUNDS
): string => {
  return IMAGE_CATEGORIES.BACKGROUNDS[category];
};
