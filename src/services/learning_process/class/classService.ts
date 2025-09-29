import { api } from "@/src/config/axios";

export const getInstructorClasses = () => {
  return api.get("/v1/workflow-process/mobile/instructor/classes");
};

export const getInstructorClassDetail = (id: string) => {
  return api.get(`/v1/workflow-process/mobile/instructor/class?id=${id}`);
};

export const takeAttendance = (id: string, data: any) => {
  return api.post(
    `/v1/workflow-process/mobile/instructor/attendance?id=${id}`,
    data
  );
};
