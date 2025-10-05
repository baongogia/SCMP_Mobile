// Export all services from a single entry point
export { authService } from "./auth/authService";
export { courseService } from "./learning_process/course/courseService";
export { chatService } from "./chat/chatService";
export { api } from "../config/axios";
export { tenantService } from "./auth/tenants/tenantService";

// Children services
export {
  createChildrenAccount,
  getChildrenAccount,
  getChildrenSchedule,
} from "./information/children/childenServices";
