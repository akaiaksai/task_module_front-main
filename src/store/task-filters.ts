// store/task-filters.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface TaskFiltersState {
  onlyMyTasks: boolean;
  onlyAuditor: boolean;
  onlyAccomplice: boolean;
  onlyCreator: boolean;
  status: string;
  search: string;
  period: string;
  groupId: number | null;
  selectedDate: Date; // Добавляем выбранную дату

  assigneeIds: number[];
  setAssigneeIds: (ids: number[]) => void;
  toggleAssigneeId: (id: number) => void;
  clearAssignees: () => void;

  // Промежуточные состояния для админов
  pendingOnlyMyTasks: boolean;
  pendingOnlyAuditor: boolean;
  pendingOnlyAccomplice: boolean;
  pendingOnlyCreator: boolean;
  pendingStatus: string;
  pendingSearch: string;
  pendingPeriod: string;

  // Действия
  setOnlyMyTasks: (value: boolean) => void;
  setOnlyAuditor: (value: boolean) => void;
  setOnlyAccomplice: (value: boolean) => void;
  setOnlyCreator: (value: boolean) => void;
  setStatus: (status: string) => void;
  setSearch: (search: string) => void;
  setPeriod: (period: string) => void;
  setGroupId: (groupId: number | null) => void;
  setSelectedDate: (date: Date) => void; // Добавляем действие для даты

  // Действия для промежуточных состояний (для админов)
  setPendingOnlyMyTasks: (value: boolean) => void;
  setPendingOnlyAuditor: (value: boolean) => void;
  setPendingOnlyAccomplice: (value: boolean) => void;
  setPendingOnlyCreator: (value: boolean) => void;
  setPendingStatus: (status: string) => void;
  setPendingSearch: (search: string) => void;
  setPendingPeriod: (period: string) => void;

  // Применение промежуточных состояний
  applyPendingFilters: () => void;
  resetPendingFilters: () => void;

  resetFilters: () => void;
  resetFiltersForProjects: () => void;
}

export const useTaskFiltersStore = create<TaskFiltersState>()(
  persist(
    (set, get) => ({
      // Начальные значения
      onlyMyTasks: false,
      onlyAuditor: false,
      onlyAccomplice: false,
      onlyCreator: false,
      status: '-5',
      search: '',
      period: '',
      groupId: null,
      selectedDate: new Date(), // Инициализируем текущей датой

      assigneeIds: [],

      setAssigneeIds: (ids) => set({ assigneeIds: ids }),

      toggleAssigneeId: (id) =>
        set((state) => ({
          assigneeIds: state.assigneeIds.includes(id)
            ? state.assigneeIds.filter((x) => x !== id)
            : [...state.assigneeIds, id],
        })),

      clearAssignees: () => set({ assigneeIds: [] }),

      // Промежуточные состояния
      pendingOnlyMyTasks: false,
      pendingOnlyAuditor: false,
      pendingOnlyAccomplice: false,
      pendingOnlyCreator: false,
      pendingStatus: '-5',
      pendingSearch: '',
      pendingPeriod: '',

      // Действия для основных состояний
      setOnlyMyTasks: (onlyMyTasks) => set({ onlyMyTasks }),
      setOnlyAuditor: (onlyAuditor) => set({ onlyAuditor }),
      setOnlyAccomplice: (onlyAccomplice) => set({ onlyAccomplice }),
      setOnlyCreator: (onlyCreator) => set({ onlyCreator }),
      setStatus: (status) => set({ status }),
      setSearch: (search) => set({ search }),
      setPeriod: (period) => set({ period }),
      setGroupId: (groupId) => set({ groupId }),
      setSelectedDate: (selectedDate) => set({ selectedDate }), // Новое действие

      // Действия для промежуточных состояний
      setPendingOnlyMyTasks: (pendingOnlyMyTasks) =>
        set({ pendingOnlyMyTasks }),
      setPendingOnlyAuditor: (pendingOnlyAuditor) =>
        set({ pendingOnlyAuditor }),
      setPendingOnlyAccomplice: (pendingOnlyAccomplice) =>
        set({ pendingOnlyAccomplice }),
      setPendingOnlyCreator: (pendingOnlyCreator) =>
        set({ pendingOnlyCreator }),
      setPendingStatus: (pendingStatus) => set({ pendingStatus }),
      setPendingSearch: (pendingSearch) => set({ pendingSearch }),
      setPendingPeriod: (pendingPeriod) => set({ pendingPeriod }),

      // Применение промежуточных состояний
      applyPendingFilters: () => {
        const {
          pendingOnlyMyTasks,
          pendingOnlyAuditor,
          pendingOnlyAccomplice,
          pendingOnlyCreator,
          pendingStatus,
          pendingSearch,
          pendingPeriod,
        } = get();

        set({
          onlyMyTasks: pendingOnlyMyTasks,
          onlyAuditor: pendingOnlyAuditor,
          onlyAccomplice: pendingOnlyAccomplice,
          onlyCreator: pendingOnlyCreator,
          status: pendingStatus,
          search: pendingSearch,
          period: pendingPeriod,
        });
      },

      // Сброс промежуточных состояний
      resetPendingFilters: () => {
        const {
          onlyMyTasks,
          onlyAuditor,
          onlyAccomplice,
          onlyCreator,
          status,
          search,
          period,
        } = get();

        set({
          pendingOnlyMyTasks: onlyMyTasks,
          pendingOnlyAuditor: onlyAuditor,
          pendingOnlyAccomplice: onlyAccomplice,
          pendingOnlyCreator: onlyCreator,
          pendingStatus: status,
          pendingSearch: search,
          pendingPeriod: period,
        });
      },

      resetFilters: () =>
        set({
          onlyMyTasks: false,
          onlyAuditor: false,
          onlyAccomplice: false,
          onlyCreator: false,
          status: '-5',
          search: '',
          period: '',
          groupId: null,
          selectedDate: new Date(), // Сбрасываем дату
          pendingOnlyMyTasks: false,
          pendingOnlyAuditor: false,
          pendingOnlyAccomplice: false,
          pendingOnlyCreator: false,
          pendingStatus: '-5',
          pendingSearch: '',
          pendingPeriod: '',
        }),

      resetFiltersForProjects: () =>
        set({
          onlyMyTasks: false,
          onlyAuditor: false,
          onlyAccomplice: false,
          onlyCreator: false,
          search: '',
          period: '',
          groupId: null,
          pendingOnlyMyTasks: false,
          pendingOnlyAuditor: false,
          pendingOnlyAccomplice: false,
          pendingOnlyCreator: false,
          pendingSearch: '',
          pendingPeriod: '',
        }),
    }),
    {
      name: 'task-filters-storage',
      version: 3,
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value) => {
          if (key === 'selectedDate' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        },
      }),
      migrate: (persistedState: ANY, version) => {
        if (version === 2) {
          return {
            ...persistedState,
            selectedDate: new Date().toISOString(),
          };
        }
        return persistedState;
      },
    }
  )
);
