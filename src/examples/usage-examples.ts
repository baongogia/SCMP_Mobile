/**
 * Usage Examples for the new project structure
 * This file demonstrates how to use the refactored codebase
 */

import { authService, courseService, chatService } from "../services";
import { User, Course, LoginRequest } from "../types";
import { colors, strings, API_ENDPOINTS } from "../constants";
import { format, validation, storage } from "../utils";

// ===== AUTHENTICATION EXAMPLES =====

// Login example
export const loginExample = async () => {
  try {
    const credentials: LoginRequest = {
      email: "user@example.com",
      password: "password123",
    };

    // Validate email
    if (!validation.email(credentials.email)) {
      throw new Error("Invalid email format");
    }

    // Login
    const response = await authService.login(credentials);
    console.log("Login successful:", response.data.user);

    return response;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

// Check authentication status
export const checkAuthExample = async () => {
  const isAuthenticated = await authService.isAuthenticated();
  const user = await authService.getStoredUser();

  return { isAuthenticated, user };
};

// ===== COURSE EXAMPLES =====

// Get member courses
export const getCoursesExample = async (tenant: string) => {
  try {
    const response = await courseService.getMemberCourses(tenant);
    const courses = response.data;

    // Format course data
    const formattedCourses = courses.map((course) => ({
      ...course,
      formattedPrice: format.currency(course.price),
      formattedDuration: format.duration(course.duration),
      formattedDate: format.date(course.createdAt),
    }));

    return formattedCourses;
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    throw error;
  }
};

// Order a course
export const orderCourseExample = async (tenant: string, courseId: string) => {
  try {
    const response = await courseService.orderCourse(tenant, courseId);
    console.log("Course ordered successfully:", response.data);
    return response;
  } catch (error) {
    console.error("Failed to order course:", error);
    throw error;
  }
};

// ===== CHAT EXAMPLES =====

// Get conversations
export const getConversationsExample = async (tenant: string) => {
  try {
    const response = await chatService.getMemberConversations(tenant);
    const conversations = response.data;

    // Format conversation data
    const formattedConversations = conversations.map((conv) => ({
      ...conv,
      lastMessageTime: conv.lastMessage
        ? format.dateTime(conv.lastMessage.createdAt)
        : null,
      unreadCount: conv.unreadCount,
    }));

    return formattedConversations;
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    throw error;
  }
};

// Send a message
export const sendMessageExample = async (
  tenant: string,
  conversationId: string,
  content: string
) => {
  try {
    const messageData = {
      conversationId,
      content,
      type: "text" as const,
    };

    const response = await chatService.sendMemberMessage(tenant, messageData);
    console.log("Message sent successfully:", response.data);
    return response;
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }
};

// ===== STORAGE EXAMPLES =====

// Store user data
export const storeUserExample = async (user: User) => {
  try {
    await storage.setUser(user);
    await storage.setTenant(user.tenant || "");
    console.log("User data stored successfully");
  } catch (error) {
    console.error("Failed to store user data:", error);
    throw error;
  }
};

// Get stored data
export const getStoredDataExample = async () => {
  try {
    const user = await storage.getUser();
    const token = await storage.getToken();
    const tenant = await storage.getTenant();

    return { user, token, tenant };
  } catch (error) {
    console.error("Failed to get stored data:", error);
    throw error;
  }
};

// ===== VALIDATION EXAMPLES =====

// Form validation
export const validateFormExample = (formData: any) => {
  const errors: { [key: string]: string } = {};

  // Email validation
  if (!validation.required(formData.email)) {
    errors.email = "Email is required";
  } else if (!validation.email(formData.email)) {
    errors.email = "Invalid email format";
  }

  // Password validation
  if (!validation.required(formData.password)) {
    errors.password = "Password is required";
  } else {
    const passwordValidation = validation.password(formData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.message || "Invalid password";
    }
  }

  // Phone validation
  if (formData.phone && !validation.phone(formData.phone)) {
    errors.phone = "Invalid phone number";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// ===== FORMATTING EXAMPLES =====

// Format various data types
export const formattingExamples = () => {
  const examples = {
    currency: format.currency(150000), // "₫150.000"
    date: format.date(new Date()), // "18/09/2025"
    dateTime: format.dateTime(new Date()), // "18/09/2025, 10:30"
    time: format.time("14:30"), // "2:30 PM"
    duration: format.duration(90), // "1h 30m"
    fileSize: format.fileSize(1024000), // "1000 KB"
    phone: format.phone("0123456789"), // "0123 456 789"
    initials: format.getInitials("Nguyen Van A"), // "NA"
  };

  return examples;
};

// ===== COMPONENT USAGE EXAMPLES =====

// Example of using constants in components
export const componentStyleExample = {
  container: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500" as const,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
};

// Example of using strings in components
export const componentTextExample = {
  title: strings.courses.title,
  loginButton: strings.auth.login,
  loadingText: strings.common.loading,
  errorMessage: strings.errors.networkError,
};

// ===== ERROR HANDLING EXAMPLES =====

// API error handling
export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || "Server error";

    switch (status) {
      case 401:
        return strings.errors.unauthorized;
      case 403:
        return strings.errors.forbidden;
      case 404:
        return strings.errors.notFound;
      case 500:
        return strings.errors.serverError;
      default:
        return message;
    }
  } else if (error.request) {
    // Network error
    return strings.errors.networkError;
  } else {
    // Other error
    return strings.errors.unknownError;
  }
};

// ===== COMPLETE WORKFLOW EXAMPLE =====

// Complete login workflow
export const completeLoginWorkflow = async (
  email: string,
  password: string
) => {
  try {
    // 1. Validate input
    const validation = validateFormExample({ email, password });
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors).join(", "));
    }

    // 2. Login
    const loginResponse = await authService.login({ email, password });
    const user = loginResponse.data.user;

    // 3. Store user data
    await storage.setUser(user);
    if (user.tenant) {
      await storage.setTenant(user.tenant);
    }

    // 4. Get user's courses
    if (user.tenant) {
      const courses = await courseService.getMemberCourses(user.tenant);
      console.log("User courses:", courses.data);
    }

    // 5. Get user's conversations
    if (user.tenant) {
      const conversations = await chatService.getMemberConversations(
        user.tenant
      );
      console.log("User conversations:", conversations.data);
    }

    return {
      success: true,
      user,
      message: strings.auth.loginSuccess,
    };
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
      message: strings.auth.loginError,
    };
  }
};
