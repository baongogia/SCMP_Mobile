// Export all services from a single entry point
export { authService } from "./auth/authService";
export { courseService } from "./learning_process/course/courseService";
export { getAllChannels, getChannel, sendMessage } from "./chat/chatService";
export { api } from "../config/axios";
export { tenantService } from "./auth/tenants/tenantService";
export { weatherService } from "./weather_show/weather/weatherService";
export { locationService } from "./weather_show/location/locationService";

// Children services
export {
  createChildrenAccount,
  getChildrenAccount,
  getChildrenSchedule,
} from "./information/children/childenServices";

// Certificate services
export {
  getCertificationFrame,
  getCertificate,
} from "./learning_process/certificate/certificateServices";
