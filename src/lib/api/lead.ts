// src/lib/api/crm/leads.ts
import { http } from '../http';

export interface CrmLead {
  id: number;
  title: { String: string; Valid: boolean };
  statusId?: { String: string; Valid: boolean };
  crmRef?: string; // например "L_22896"
}

export const fetchCrmLeads = async (
  search: string
): Promise<{ result: CrmLead[] }> => {
  const params = search ? { search } : {};
  const { data } = await http.get<{ result: CrmLead[] }>('/crm/leads/list', {
    params,
  });
  return data;
};
