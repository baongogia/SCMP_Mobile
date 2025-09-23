import { api } from "@/src/config/axios";

interface Status {
  InProgress: "InProgress";
  Approved: "Approved";
  Rejected: "Rejected";
}

export const getApplications = async () => {
  return api.get(`/v1/workflow-process/applications`);
};

export const getApplicationsStatus = async (
  searchKey: string,
  status: Status
) => {
  return api.get(
    `/v1/workflow-process/applications?searchKey=${searchKey}&status=${status}`
  );
};

export const createApplication = async (data: {
  title: string;
  content: string;
  media?: string;
  status: string;
  type?: string;
}) => {
  return api.post(`/v1/workflow-process/applications`, data);
};
