import { api } from "@/src/config/axios";
import { API_ENDPOINTS } from "@/src/constants/config";

export interface TenantItem {
  _id?: string;
  id?: string;
  value?: string;
  name?: string;
  label?: string;
}

export interface TenantsResponse {
  data: TenantItem[];
  message?: string;
  statusCode?: number;
}

export const tenantService = {
  async getAvailableTenants() {
    return api.get<TenantsResponse>(API_ENDPOINTS.MEMBER.TENANTS_AVAILABLE);
  },
};
