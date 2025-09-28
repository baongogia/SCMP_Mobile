import { api } from "@/src/config/axios";

export const getMemberNews = () => {
  return api.get("/v1/workflow-process/mobile/member/news");
};

export const getInstructorNews = () => {
  return api.get(`/v1/workflow-process/mobile/instructor/news`);
};
