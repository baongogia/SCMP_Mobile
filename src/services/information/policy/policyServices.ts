import { api } from "@/src/config/axios";

// Fetch policy and normalize to an array for consumers
export const getPolicy = async (): Promise<any[]> => {
  const response = await api.get(`/v1/workflow-process/mobile/policy`);
  const d: any = response?.data;
  const data = d?.data?.data || d?.data || d;
  return Array.isArray(data) ? data : [];
};
