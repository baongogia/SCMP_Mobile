import { api } from "@/src/config/axios";

export const getCertificationFrame = () => {
  return api.get("/v1/workflow-process/mobile/certificate-frame");
};

export const getCertificate = () => {
  return api.get("/v1/workflow-process/mobile/certificates");
};
