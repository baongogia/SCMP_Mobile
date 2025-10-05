import { api } from "@/src/config/axios";

export const createChildrenAccount = (data: any) => {
  return api.post(`/v1/workflow-process/mobile/member/children-account`, data);
};
// payload data
//{
//   "username": "example",
//   "email": "example",
//   "password": "example",
//   "birthday": "example"
// }

export const getChildrenAccount = () => {
  return api.get(`/v1/workflow-process/mobile/member/children-account`);
};

export const getChildrenSchedule = (
  child_id: string,
  startDate: string,
  endDate: string
) => {
  return api.get(
    `/v1/workflow-process/mobile/member/schedules-child?child_id=${child_id}&startDate=${startDate}&endDate=${endDate}`
  );
};
