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
  const { title = "Lỗi", message, duration = 4000 } = options;

  let errorMessage = message;

  if (!errorMessage) {
    if (typeof error === "string") {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else {
      errorMessage = "Đã xảy ra lỗi không xác định";
    }
  }

  Toast.show({
    type: "error",
    text1: title,
    text2: errorMessage,
    visibilityTime: duration,
  });
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
