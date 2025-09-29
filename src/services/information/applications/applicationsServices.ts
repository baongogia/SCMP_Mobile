import { api } from "@/src/config/axios";

interface Status {
  InProgress: "InProgress";
  Approved: "Approved";
  Rejected: "Rejected";
}

export const getApplications = async () => {
  return api.get(`v1/workflow-process/mobile/application`);
};

export const getApplicationsStatus = async (
  searchKey: string,
  status: Status
) => {
  return api.get(
    `/v1/workflow-process/applications?searchKey=${searchKey}&status=${status}`
  );
};

export const getApplicationsType = async () => {
  return api.get(`/v1/workflow-process/mobile/application/type`);
};

export const sendApplication = async (data: {
  title: string;
  content: string;
  type?: string;
  file?: string;
}) => {
  // Remove type field if it's not a valid ObjectId format
  const payload = { ...data };
  if (payload.type && !payload.type.match(/^[0-9a-fA-F]{24}$/)) {
    delete payload.type;
  }

  return api.post(`/v1/workflow-process/mobile/application`, payload);
};
