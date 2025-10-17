import { api } from "@/src/config/axios";

export const getAllOrders = () => {
  return api.get("/v1/workflow-process/mobile/member/orders");
};

export const payOrderZaloPay = (data: any) => {
  return api.post(`/zalopay/order`, data);
};
