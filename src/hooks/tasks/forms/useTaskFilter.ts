import { useDebounced } from '../../ui/useDebounced';
import useQueryParams from '../../ui/useQueryParams';

export interface TasksFilters {
  page: string;
  perPage: string;
  search: string;
  status: string;
  sort: string;
  period: string;
  responsibleId: string;
  createdBy: string;
  view: 'list' | 'kanban' | 'calendar';
  cal: 'month' | 'week' | 'day';
  date: string;
}

const defaultFilters: TasksFilters = {
  page: '1',
  perPage: '15',
  search: '',
  status: '-5',
  sort: '-updatedAt',
  period: '',
  responsibleId: '',
  createdBy: '',
  view: 'calendar',
  cal: 'week',
  date: new Date().toISOString().split('T')[0],
};

export function useTasksFilters() {
  const { params, setParams } = useQueryParams<TasksFilters>(defaultFilters);
  const debouncedSearch = useDebounced(params.search);

  const updateFilters = (updates: Partial<TasksFilters>) => {
    setParams(updates);
  };

  const resetFilters = () => {
    setParams(defaultFilters);
  };

  return {
    filters: params,
    debouncedSearch,
    updateFilters,
    resetFilters,
  };
}
