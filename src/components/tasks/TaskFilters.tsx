import { UserSearchInput } from '@/components/users/UserSearchInput';
import { useDebounced } from '@/hooks/ui/useDebounced';
import { useAuthStore } from '@/store/auth';
import { useTaskFiltersStore } from '@/store/task-filters';
import Input from '@/ui/Input';
import Select from '@/ui/Select';
import { Loader, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import Checkbox from '../../ui/Checkbox';

interface TaskFiltersProps {
  isFetchingTasks?: boolean;
  onFiltersChange?: () => void;
  showRoleFilters?: boolean;
  showAdminFilters?: boolean;
  localFilters?: {
    responsibleId?: string;
    createdBy?: string;
  };
  onLocalFilterChange?: (filters: {
    responsibleId?: string;
    createdBy?: string;
  }) => void;
  defaultStatus?: string;
}

export function TaskFilters({
  isFetchingTasks = false,
  onFiltersChange,
  showRoleFilters = true,
  showAdminFilters = true,
  localFilters,
  onLocalFilterChange,
}: TaskFiltersProps) {
  const { isAdmin, userId } = useAuthStore();
  const {
    // Основные состояния
    search: globalSearch,
    status: globalStatus,
    period: globalPeriod,
    onlyMyTasks,
    onlyAuditor,
    onlyAccomplice,
    onlyCreator,

    // Промежуточные состояния для админов
    pendingSearch,
    pendingStatus,
    pendingPeriod,
    pendingOnlyMyTasks,
    pendingOnlyAuditor,
    pendingOnlyAccomplice,
    pendingOnlyCreator,

    // Действия для основных состояний
    setSearch: setGlobalSearch,
    setStatus: setGlobalStatus,
    setOnlyMyTasks,
    setOnlyAuditor,
    setOnlyAccomplice,
    setOnlyCreator,

    // Действия для промежуточных состояний
    setPendingSearch,
    setPendingStatus,
    setPendingOnlyMyTasks,
    setPendingOnlyAuditor,
    setPendingOnlyAccomplice,
    setPendingOnlyCreator,

    // Применение фильтров
    applyPendingFilters,
    resetPendingFilters,
  } = useTaskFiltersStore();

  // Локальное состояние для поиска (дебаунс)
  const [localSearch, setLocalSearch] = useState(
    isAdmin ? pendingSearch : globalSearch
  );

  const debouncedLocalSearch = useDebounced(localSearch, 400);

  // Эффект для дебаунс поиска для обычных пользователей
  useEffect(() => {
    if (!isAdmin) {
      setGlobalSearch(debouncedLocalSearch);
      onFiltersChange?.();
    }
  }, [debouncedLocalSearch, isAdmin]);

  // Эффект для синхронизации промежуточных состояний при изменении основных
  useEffect(() => {
    if (isAdmin) {
      resetPendingFilters();
    }
  }, [
    globalSearch,
    globalStatus,
    globalPeriod,
    onlyMyTasks,
    onlyAuditor,
    onlyAccomplice,
    onlyCreator,
    isAdmin,
  ]);

  // Проверка есть ли изменения у админа (включая onlyMyTasks)
  const hasPendingChanges =
    isAdmin &&
    (pendingSearch !== globalSearch ||
      pendingStatus !== globalStatus ||
      pendingPeriod !== globalPeriod ||
      pendingOnlyMyTasks !== onlyMyTasks ||
      pendingOnlyAuditor !== onlyAuditor ||
      pendingOnlyAccomplice !== onlyAccomplice ||
      pendingOnlyCreator !== onlyCreator);

  // Обработчики изменений
  const handleGlobalSearchChange = (value: string) => {
    if (isAdmin) {
      setPendingSearch(value);
      setLocalSearch(value);
    } else {
      setLocalSearch(value);
    }
  };

  const handleGlobalStatusChange = (value: string) => {
    if (isAdmin) {
      setPendingStatus(value);
    } else {
      setGlobalStatus(value);
      onFiltersChange?.();
    }
  };

  // COMMENT
  // const handleGlobalPeriodChange = (value: string) => {
  //   if (isAdmin) {
  //     setPendingPeriod(value);
  //   } else {
  //     setGlobalPeriod(value);
  //     onFiltersChange?.();
  //   }
  // };

  const handleRoleFilterChange = (role: string, checked: boolean) => {
    if (isAdmin) {
      // Для админов используем промежуточные состояния для всех ролей
      switch (role) {
        case 'myTasks':
          setPendingOnlyMyTasks(checked);
          break;
        case 'auditor':
          setPendingOnlyAuditor(checked);
          break;
        case 'accomplice':
          setPendingOnlyAccomplice(checked);
          break;
        case 'creator':
          setPendingOnlyCreator(checked);
          break;
      }
    } else {
      // Для обычных пользователей применяем сразу
      switch (role) {
        case 'myTasks':
          setOnlyMyTasks(checked);
          break;
        case 'auditor':
          setOnlyAuditor(checked);
          break;
        case 'accomplice':
          setOnlyAccomplice(checked);
          break;
        case 'creator':
          setOnlyCreator(checked);
          break;
      }
      onFiltersChange?.();
    }
  };

  // Обработчики для админских фильтров
  const handleResponsibleChange = (value: string) => {
    onLocalFilterChange?.({
      ...localFilters,
      responsibleId: value,
    });
    onFiltersChange?.();
  };

  const handleCreatedByChange = (value: string) => {
    onLocalFilterChange?.({
      ...localFilters,
      createdBy: value,
    });
    onFiltersChange?.();
  };

  const handleResponsibleClear = () => {
    onLocalFilterChange?.({
      ...localFilters,
      responsibleId: '',
    });
    onFiltersChange?.();
  };

  const handleCreatedByClear = () => {
    onLocalFilterChange?.({
      ...localFilters,
      createdBy: '',
    });
    onFiltersChange?.();
  };

  // Применение фильтров для админа
  const handleApplyFilters = () => {
    applyPendingFilters();
    onFiltersChange?.();
  };

  // Отображение значений в зависимости от типа пользователя
  const displayValues = isAdmin
    ? {
        search: pendingSearch,
        status: pendingStatus,
        period: pendingPeriod,
        onlyMyTasks: pendingOnlyMyTasks, // Для админов используем pending состояние
        onlyAuditor: pendingOnlyAuditor,
        onlyAccomplice: pendingOnlyAccomplice,
        onlyCreator: pendingOnlyCreator,
        responsibleId: localFilters?.responsibleId || '',
        createdBy: localFilters?.createdBy || '',
      }
    : {
        search: globalSearch,
        status: globalStatus,
        period: globalPeriod,
        onlyMyTasks, // Для обычных пользователей используем основное состояние
        onlyAuditor,
        onlyAccomplice,
        onlyCreator,
        responsibleId: localFilters?.responsibleId || '',
        createdBy: localFilters?.createdBy || '',
      };

  // Значение для инпута поиска
  const searchInputValue = isAdmin ? pendingSearch : localSearch;

  return (
    <div className="flex flex-wrap gap-2 w-full items-end">
      <div
        className="
    flex flex-wrap items-end justify-between
    gap-x-[clamp(0.4rem,0.4rem+0.4vw,0.8rem)]
    gap-y-[clamp(0.4rem,0.3rem+0.3vw,0.6rem)]
    w-full max-w-full min-w-0
    max-[346px]:flex-col
  "
      >
        {/* Поиск */}
        <div
          className="
      w-full md:flex-1
      order-3 md:order-none
      mt-[clamp(0.3rem,0.25rem+0.4vw,0.7rem)] md:mt-0
    "
        >
          <Input
            placeholder="Поиск…"
            value={searchInputValue}
            onChange={(e) => handleGlobalSearchChange(e.target.value)}
            disabled={isFetchingTasks}
          />
        </div>

        <div
          className="
    flex flex-row flex-nowrap
    items-stretch
    max-[346px]:w-full
    max-[346px]:flex-col
    gap-1
  "
        >
          {/* Статус */}
          <Select
            value={displayValues.status}
            onChange={(val) => handleGlobalStatusChange(String(val))}
            disabled={isFetchingTasks}
            options={[
              { value: '-5', label: 'Не завершенные' },
              { value: ' ', label: 'Все статусы' },
              { value: '3', label: 'Новые/Открыта' },
              { value: '2', label: 'В работе' },
              { value: '5', label: 'Готово' },
              { value: '4', label: 'Блок/Отложена' },
            ]}
            className="max-[346px]:w-full "
          />
        </div>

        {/* Админ-фильтры */}
        {showAdminFilters && isAdmin && (
          <>
            <div className="flex-grow min-w-[180px]">
              <UserSearchInput
                placeholder="Ответственный"
                value={displayValues.responsibleId}
                onChange={handleResponsibleChange}
                onClear={handleResponsibleClear}
                disabled={isFetchingTasks}
              />
            </div>

            <div className="flex-grow min-w-[180px]">
              <UserSearchInput
                placeholder="Создатель"
                value={displayValues.createdBy}
                onChange={handleCreatedByChange}
                onClear={handleCreatedByClear}
                disabled={isFetchingTasks}
              />
            </div>
          </>
        )}
      </div>

      {/* Кнопка применения для админов */}
      {isAdmin && hasPendingChanges && (
        <div className="flex gap-2 items-center">
          <button
            onClick={handleApplyFilters}
            disabled={isFetchingTasks}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isFetchingTasks ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Применить
          </button>
        </div>
      )}

      {/* Фильтры по ролям */}
      {showRoleFilters && (
        <div className="flex flex-wrap gap-4 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 w-full mt-2">
          <Checkbox
            checked={displayValues.onlyMyTasks}
            onChange={(checked) => handleRoleFilterChange('myTasks', checked)}
            disabled={isFetchingTasks || !userId}
            label="Я исполнитель"
          />
          <Checkbox
            checked={displayValues.onlyAuditor}
            onChange={(checked) => handleRoleFilterChange('auditor', checked)}
            disabled={isFetchingTasks || !userId}
            label="Я наблюдатель"
          />
          <Checkbox
            checked={displayValues.onlyAccomplice}
            onChange={(checked) =>
              handleRoleFilterChange('accomplice', checked)
            }
            disabled={isFetchingTasks || !userId}
            label="Я соисполнитель"
          />
          <Checkbox
            checked={displayValues.onlyCreator}
            onChange={(checked) => handleRoleFilterChange('creator', checked)}
            disabled={isFetchingTasks || !userId}
            label="Я постановщик"
          />
        </div>
      )}
    </div>
  );
}
