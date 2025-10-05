import { api } from "@/src/config/axios";
import { API_ENDPOINTS } from "@/src/constants/config";
import {
  Conversation,
  Message,
  SendMessageRequest,
  ApiResponse,
  PaginationParams,
} from "@/src/types";

export const chatService = {
  // Member chat services
  async getMemberConversations(
    tenant: string,
    params?: PaginationParams
  ): Promise<ApiResponse<Conversation[]>> {
    try {
      const response = await api.get<ApiResponse<Conversation[]>>(
        API_ENDPOINTS.MEMBER.CONVERSATIONS,
        {
          headers: {
            "x-tenant-id": tenant,
          },
          params,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching member conversations:", error);
      throw error;
    }
  },

  async getMemberConversation(
    tenant: string,
    conversationId: string,
    params?: PaginationParams
  ): Promise<ApiResponse<Message[]>> {
    try {
      const response = await api.get<ApiResponse<Message[]>>(
        `${API_ENDPOINTS.MEMBER.CONVERSATION}/${conversationId}`,
        {
          headers: {
            "x-tenant-id": tenant,
          },
          params,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching member conversation:", error);
      throw error;
    }
  },

  async sendMemberMessage(
    tenant: string,
    messageData: SendMessageRequest
  ): Promise<ApiResponse<Message>> {
    try {
      const response = await api.post<ApiResponse<Message>>(
        API_ENDPOINTS.MEMBER.CONVERSATION,
        messageData,
        {
          headers: {
            "x-tenant-id": tenant,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error sending member message:", error);
      throw error;
    }
  },

  // Instructor chat services
  async getInstructorConversations(
    tenant: string,
    params?: PaginationParams
  ): Promise<ApiResponse<Conversation[]>> {
    try {
      const response = await api.get<ApiResponse<Conversation[]>>(
        API_ENDPOINTS.INSTRUCTOR.CONVERSATIONS,
        {
          headers: {
            "x-tenant-id": tenant,
          },
          params,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching instructor conversations:", error);
      throw error;
    }
  },

  async getInstructorConversation(
    tenant: string,
    conversationId: string,
    params?: PaginationParams
  ): Promise<ApiResponse<Message[]>> {
    try {
      const response = await api.get<ApiResponse<Message[]>>(
        `${API_ENDPOINTS.INSTRUCTOR.CONVERSATION}/${conversationId}`,
        {
          headers: {
            "x-tenant-id": tenant,
          },
          params,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching instructor conversation:", error);
      throw error;
    }
  },

  async sendInstructorMessage(
    tenant: string,
    messageData: SendMessageRequest
  ): Promise<ApiResponse<Message>> {
    try {
      const response = await api.post<ApiResponse<Message>>(
        API_ENDPOINTS.INSTRUCTOR.CONVERSATION,
        messageData,
        {
          headers: {
            "x-tenant-id": tenant,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error sending instructor message:", error);
      throw error;
    }
  },
};

export const getAllChannels = async () => {
  return api.get("/v1/workflow-process/message/channels");
};

export const getChannel = async (
  classId: string,
  page: number = 1,
  limit: number = 10
) => {
  return api.get(
    `/v1/workflow-process/message/channel?class_id=${classId}&page=${page}&limit=${limit}`
  );
};

export const sendMessage = async (class_id: string, content: string) => {
  // Normalize payload to avoid accidental wrapping quotes in Flipper logs
  const sanitizedContent =
    typeof content === "string"
      ? content.trim().replace(/^['"]|['"]$/g, "")
      : String(content ?? "");

  return api.post(`/v1/workflow-process/message/channel?class_id=${class_id}`, {
    content: sanitizedContent,
  });
};
