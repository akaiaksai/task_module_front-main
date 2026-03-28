import { useQuery } from '@tanstack/react-query';
import { http } from '../../lib/http';

export interface SmartProcessType {
  ID: number;
  EntityTypeID: number;
  Title: { String: string };
  CreatedTime: string;
  TableName: string;
}

export function useSmartProcessTypes() {
  const { data, isLoading, error } = useQuery<SmartProcessType[], Error>({
    queryKey: ['smart-process-types'],
    queryFn: async () => {
      const response = await http.get<{ result: SmartProcessType[] }>(
        '/smart_process/types'
      );
      return response.data.result || [];
    },
    staleTime: 1000 * 60 * 10, // 10 мин кэш
  });

  return {
    types: data || [],
    isLoading,
    error,
  };
}
