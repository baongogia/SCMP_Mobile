import { api } from "@/src/config/axios";

export const getAllMemberSchedules = (
  startDate: string,
  endDate: string,
  signal?: AbortSignal
) => {
  return api.get(
    `/v1/workflow-process/mobile/member/schedules?startDate=${startDate}&endDate=${endDate}`,
    { signal }
  );
};

export const getMemberScheduleDetail = (scheduleId: string) => {
  return api.get(`/v1/workflow-process/schedule?id=${scheduleId}`);
};

export const getInstructorSchedules = (
  startDate: string,
  endDate: string,
  signal?: AbortSignal
) => {
  return api.get(
    `/v1/workflow-process/mobile/instructor/schedules?startDate=${startDate}&endDate=${endDate}`,
    { signal }
  );
};

export const getInstructorScheduleDetail = (
  scheduleId: string,
  signal?: AbortSignal
) => {
  return api.get(
    `/v1/workflow-process/mobile/instructor/schedule-detail?schedule_id=${scheduleId}`,
    { signal }
  );
};
