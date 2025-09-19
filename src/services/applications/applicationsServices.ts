import { api } from "@/src/config/axios";

interface Status {
  InProgress: "InProgress";
  Approved: "Approved";
  Rejected: "Rejected";
}
export const getApplications = async (id: string) => {
  return api.get(`/workflow-process/application?id=${id}`);
};

export const getApplicationsStatus = async (
  searchKey: string,
  status: Status
) => {
  return api.get(
    `/workflow-process/applications?searchKey=${searchKey}&status=${status}`
  );
};
