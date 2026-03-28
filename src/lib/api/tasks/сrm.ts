import {
  DealFunnelsResponse,
  DealsFilterParams,
  DealsResponse,
} from '@/shared/types/crm';
import { http } from '../../http';

export const fetchDealFunnels = async (): Promise<DealFunnelsResponse> => {
  const response = await http.get('/crm/deal_funnels/list');
  return response.data;
};

export const fetchDeals = async (
  params?: DealsFilterParams
): Promise<DealsResponse> => {
  const response = await http.get('/crm/deals/list', { params });
  return response.data;
};

export const searchCompanies = async (
  search: string
): Promise<{ result: ANY[] }> => {
  const response = await http.get('/crm/companies', {
    params: { search },
  });
  return response.data;
};
