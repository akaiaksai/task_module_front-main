import {
  CRMState,
  Company,
  Deal,
  DealFunnel,
  DealsFilterParams,
} from '@/shared/types/crm';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import {
  fetchDealFunnels,
  fetchDeals,
  searchCompanies,
} from '../../lib/api/tasks/сrm';

const normalizeDeals = (data: ANY): Deal[] => {
  if (!data) {
    return [];
  }
  if (Array.isArray(data)) {
    return data;
  }
  if (data.result && Array.isArray(data.result)) {
    return data.result;
  }
  if (data.items && Array.isArray(data.items)) {
    return data.items;
  }
  return [];
};
export function useCRMAllDeals() {
  const [filters] = useState<DealsFilterParams>({
    page: 1,
    limit: 1000000, // Большой лимит для получения всех сделок
  });

  // Запрос для воронок сделок
  const dealFunnelsQuery = useQuery({
    queryKey: ['deal-funnels'],
    queryFn: fetchDealFunnels,
    staleTime: 10 * 60 * 1000,
  });

  // Запрос для ВСЕХ сделок с большим лимитом
  const dealsQuery = useQuery({
    queryKey: ['all-deals'], // Отдельный ключ для всех сделок
    queryFn: () => fetchDeals(filters),
    staleTime: 2 * 60 * 1000,
  });

  // Запрос для поиска компаний
  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: () => searchCompanies(''),
    staleTime: 5 * 60 * 1000,
  });

  // Мемоизированные данные с нормализацией
  const dealFunnels = useMemo(
    () => dealFunnelsQuery.data?.result || [],
    [dealFunnelsQuery.data]
  );

  const deals = useMemo((): Deal[] => {
    return normalizeDeals(dealsQuery.data);
  }, [dealsQuery.data]);

  const companies = useMemo(
    () => companiesQuery.data?.result || [],
    [companiesQuery.data]
  );

  const error = useMemo(
    () => dealFunnelsQuery.error || dealsQuery.error || null,
    [dealFunnelsQuery.error, dealsQuery.error]
  );

  const isLoading = useMemo(
    () => dealsQuery.isLoading || dealFunnelsQuery.isLoading,
    [dealsQuery.isLoading, dealFunnelsQuery.isLoading]
  );

  // Получение сделки по ID
  const getDealById = useCallback(
    (dealId: number): Deal | undefined => {
      return deals.find((deal) => deal.ID === dealId);
    },
    [deals]
  );

  // Получение нескольких сделок по ID
  const getDealsByIds = useCallback(
    (dealIds: number[]): Deal[] => {
      return deals.filter((deal) => dealIds.includes(deal.ID));
    },
    [deals]
  );

  return {
    // Данные
    dealFunnels: dealFunnels as DealFunnel[],
    deals,
    companies: companies as Company[],

    // Состояние
    isLoading,
    error,

    // Функции
    getDealById,
    getDealsByIds,
  };
}
const initialState: CRMState = {
  dealFunnels: [],
  deals: [],
  companies: [],
  filters: {
    page: 1,
    limit: 4,
  },
  isLoading: false,
  error: null,
};

export function useCRM() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DealsFilterParams>(
    initialState.filters
  );
  const [selectedFunnelId, setSelectedFunnelId] = useState<
    number | undefined
  >();
  const [companySearchQuery, setCompanySearchQuery] = useState('');

  // Запрос для воронок сделок
  const dealFunnelsQuery = useQuery({
    queryKey: ['deal-funnels'],
    queryFn: fetchDealFunnels,
    staleTime: 10 * 60 * 1000,
  });

  // Запрос для сделок
  const dealsQuery = useQuery({
    queryKey: ['deals', filters],
    queryFn: () => fetchDeals(filters),
    staleTime: 2 * 60 * 1000,
  });

  // Запрос для поиска компаний
  const companiesQuery = useQuery({
    queryKey: ['companies', companySearchQuery],
    queryFn: () => searchCompanies(companySearchQuery),
    enabled: companySearchQuery.length > 2,
    staleTime: 5 * 60 * 1000,
  });

  // Мемоизированные данные с нормализацией
  const dealFunnels = useMemo(
    () => dealFunnelsQuery.data?.result || [],
    [dealFunnelsQuery.data]
  );

  const deals = useMemo((): Deal[] => {
    return normalizeDeals(dealsQuery.data);
  }, [dealsQuery.data]);

  const companies = useMemo(
    () => companiesQuery.data?.result || [],
    [companiesQuery.data]
  );

  const error = useMemo(
    () => dealFunnelsQuery.error || dealsQuery.error || null,
    [dealFunnelsQuery.error, dealsQuery.error]
  );

  const isLoading = useMemo(
    () => dealsQuery.isLoading || dealFunnelsQuery.isLoading,
    [dealsQuery.isLoading, dealFunnelsQuery.isLoading]
  );

  const isCompaniesLoading = companiesQuery.isLoading;

  // Поиск компаний
  const handleCompanySearch = useCallback((query: string) => {
    setCompanySearchQuery(query);
  }, []);

  // Выбор компании
  const selectCompany = useCallback((companyId: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      COMPANY_ID: companyId,
      page: 1,
    }));
  }, []);

  // Выбор воронки
  const selectFunnel = useCallback((funnelId: number | undefined) => {
    setSelectedFunnelId(funnelId);
    setFilters((prev) => ({
      ...prev,
      CATEGORY_ID: funnelId,
      page: 1,
    }));
  }, []);

  // Поиск сделок
  const searchDeals = useCallback((title: string) => {
    setFilters((prev) => ({
      ...prev,
      title: title || undefined,
      page: 1,
    }));
  }, []);

  // Переход на страницу
  const goToPage = useCallback((page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  }, []);

  // Сброс фильтров
  const resetFilters = useCallback(() => {
    setSelectedFunnelId(undefined);
    setFilters({
      page: 1,
      limit: 4,
    });
    setCompanySearchQuery('');
  }, []);

  // Перезагрузка всех данных
  const refetchAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['deal-funnels'] });
    queryClient.invalidateQueries({ queryKey: ['deals'] });
    queryClient.invalidateQueries({ queryKey: ['companies'] });
  }, [queryClient]);

  const actions = useMemo(
    () => ({
      selectFunnel,
      searchDeals,
      goToPage,
      resetFilters,
      refetchAll,
      handleCompanySearch,
      selectCompany,
    }),
    [
      selectFunnel,
      searchDeals,
      goToPage,
      resetFilters,
      refetchAll,
      handleCompanySearch,
      selectCompany,
    ]
  );
  // Получение сделки по ID
  const getDealById = useCallback(
    (dealId: number): Deal | undefined => {
      return deals.find((deal) => deal.ID === dealId);
    },
    [deals]
  );

  // Получение нескольких сделок по ID
  const getDealsByIds = useCallback(
    (dealIds: number[]): Deal[] => {
      return deals.filter((deal) => dealIds.includes(deal.ID));
    },
    [deals]
  );

  // Поиск сделок по компании
  const getDealsByCompanyId = useCallback(
    (companyId: number): Deal[] => {
      return deals.filter((deal) => deal.company.ID === companyId);
    },
    [deals]
  );

  // Поиск сделок по воронке
  const getDealsByCategoryId = useCallback(
    (categoryId: number): Deal[] => {
      return deals.filter((deal) => deal.CategoryID === categoryId);
    },
    [deals]
  );

  return {
    // Данные
    dealFunnels: dealFunnels as DealFunnel[],
    deals,
    companies: companies as Company[],

    // Состояние
    filters,
    selectedFunnelId,
    isLoading,
    isCompaniesLoading,
    error,

    // Действия
    actions,
    getDealById,
    getDealsByIds,
    getDealsByCompanyId,
    getDealsByCategoryId,
  };
}
