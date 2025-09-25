import { api } from "@/src/config/axios";

export const getAllOrders = () => {
  return api.get("/v1/workflow-process/mobile/member/orders");
};
