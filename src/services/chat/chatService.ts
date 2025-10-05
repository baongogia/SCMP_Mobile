import { api } from "@/src/config/axios";

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
