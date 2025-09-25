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
