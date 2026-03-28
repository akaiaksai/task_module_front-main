import { useQuery } from '@tanstack/react-query';
import { http } from '../../lib/http';

export interface Group {
  ID: number;
  Name: string;
  Description: string;
  DateCreate: string;
  OwnerID?: string;
}

// Базовый хук для групп
export function useGroups() {
  const query = useQuery({
    queryKey: ['groups-v2'],
    queryFn: async (): Promise<Group[]> => {
      const response = await http.get<{ result: Group[] }>('/groups/list');
      return response.data.result;
    },
    staleTime: 30 * 60 * 1000, // 30 минут
    gcTime: 60 * 60 * 1000, // 1 час (ранее cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  return {
    groups: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

// Оптимизированный хук для поиска групп
export function useGroupsSearch(search?: string) {
  const query = useQuery({
    queryKey: ['groups', 'search', search],
    queryFn: async (): Promise<Group[]> => {
      const params = search ? { search } : {};
      const response = await http.get<{ result: Group[] }>('/groups/list', {
        params,
      });
      return response.data.result;
    },
    staleTime: 5 * 60 * 1000, // 5 минут для поиска
    gcTime: 30 * 60 * 1000, // 30 минут
    refetchOnWindowFocus: false,
    enabled: search !== undefined, // Можно включать/выключать
  });

  return {
    groups: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

// Хук для получения группы по ID
export function useGroupById(groupId: number | string | null) {
  const { groups, isLoading, error } = useGroups();

  const group =
    groups.find((g) => g.ID === parseInt(groupId as string)) || null;

  return {
    group,
    isLoading,
    error,
  };
}

// Альтернатива: хук для отдельной группы (если есть соответствующий endpoint)
export function useGroup(groupId: number | string) {
  const query = useQuery({
    queryKey: ['group', groupId],
    queryFn: async (): Promise<Group> => {
      const response = await http.get<{ result: Group }>(`/groups/${groupId}`);
      return response.data.result;
    },
    enabled: !!groupId, // Запрос выполняется только если передан ID
    staleTime: 10 * 60 * 1000, // 10 минут
  });

  return {
    group: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
