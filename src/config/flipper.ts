import { Platform } from "react-native";

// Flipper configuration
export const flipperConfig = {
  // Enable Flipper only in development
  enabled: __DEV__,

  // Network plugin configuration
  network: {
    enabled: true,
    // Log all network requests
    logRequests: true,
    // Log request/response bodies
    logBodies: true,
  },

  // Database plugin configuration (if using AsyncStorage)
  database: {
    enabled: true,
    // Log AsyncStorage operations
    logStorage: true,
  },

  // Redux plugin configuration (if using Redux)
  redux: {
    enabled: true,
    // Log state changes
    logStateChanges: true,
  },
};

// Initialize Flipper plugins
export const initializeFlipper = () => {
  if (!flipperConfig.enabled) {
    return;
  }

  try {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      // Additional setup for iOS
      if (Platform.OS === "ios") {
      }
    }
  } catch (error) {
    console.warn("Failed to initialize Flipper:", error);
  }
};

// Auto-initialize when imported in development
if (__DEV__) {
  initializeFlipper();
}

// Network debugging helper
export const logNetworkRequest = (url: string, method: string, data?: any) => {
  if (flipperConfig.enabled && flipperConfig.network.enabled) {
    console.log(`🌐 ${method.toUpperCase()} ${url}`, data ? { data } : "");
  }
};

// Storage debugging helper
export const logStorageOperation = (
  operation: string,
  key: string,
  value?: any
) => {
  if (flipperConfig.enabled && flipperConfig.database.enabled) {
    console.log(`💾 ${operation} ${key}`, value ? { value } : "");
  }
};
