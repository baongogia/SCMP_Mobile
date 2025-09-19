import { api } from "../../config/axios";
import { API_ENDPOINTS } from "../../constants/config";
import {
  Conversation,
  Message,
  SendMessageRequest,
  ApiResponse,
  PaginationParams,
} from "../../types";

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
