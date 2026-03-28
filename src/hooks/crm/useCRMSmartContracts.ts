// hooks/crm/useCRMSmartContracts.ts
import { useQuery } from '@tanstack/react-query';
import { http } from '../../lib/http';

// Вспомогательная функция для получения строкового значения
// COMMENT
// const getStringValue = (value: ANY): string => {
//   if (!value) return '';
//   if (typeof value === 'string') return value;
//   if (typeof value === 'object' && value.Valid) return value.String || '';
//   return '';
// };

export interface SmartContract {
  ID: number;
  Title: { String: string; Valid: boolean };
  StageID?: { String: string; Valid: boolean };
  AssignedByID?: { String: string; Valid: boolean };
  CreatedBy?: number;
  CreatedTime?: string;
  EntityTypeID?: number;
}

export function useCRMSmartContracts() {
  const {
    data: smartContracts = [],
    isLoading,
    error,
  } = useQuery<SmartContract[], Error>({
    queryKey: ['smart-contracts'],
    queryFn: async () => {
      try {
        const response = await http.get<{ result: SmartContract[] }>(
          '/projects/list'
        );
        return response.data.result || [];
      } catch (error) {
        console.error('Error fetching smart contracts:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 минут
    retry: 2,
  });

  return {
    smartContracts,
    isLoading,
    error,
  };
}
