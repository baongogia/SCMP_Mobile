import Toast from "react-native-toast-message";

export interface ErrorToastOptions {
  title?: string;
  message?: string;
  duration?: number;
}

/**
 * Shows an error toast notification
 * @param error - The error object or message
 * @param options - Optional configuration for the toast
 */
export const showErrorToast = (error: any, options: ErrorToastOptions = {}) => {
  // Tắt tất cả toast thông báo lỗi theo yêu cầu
  return;

  const { title = "Lỗi", message, duration = 4000 } = options;
  // ... rest of the code is effectively unreachable
};

/**
 * Shows a success toast notification
 * @param message - The success message
 * @param title - Optional title for the toast
 */
export const showSuccessToast = (
  message: string,
  title: string = "Thành công"
) => {
  Toast.show({
    type: "success",
    text1: title,
    text2: message,
    visibilityTime: 3000,
  });
};

/**
 * Shows a warning toast notification
 * @param message - The warning message
 * @param title - Optional title for the toast
 */
export const showWarningToast = (
  message: string,
  title: string = "Cảnh báo"
) => {
  Toast.show({
    type: "warning",
    text1: title,
    text2: message,
    visibilityTime: 4000,
  });
};

/**
 * Shows an info toast notification
 * @param message - The info message
 * @param title - Optional title for the toast
 */
export const showInfoToast = (message: string, title: string = "Thông tin") => {
  Toast.show({
    type: "info",
    text1: title,
    text2: message,
    visibilityTime: 3000,
  });
};
