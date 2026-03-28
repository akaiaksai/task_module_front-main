// components/tasks/TasksControlPanel.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  format,
  parseISO,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTaskFiltersStore } from '../../../store/task-filters';
import { useDebounced } from '../../../hooks/ui/useDebounced';
import { DateButton } from '../dateButton';
import { ModeSwitcher } from '../modeSwitcher';
import { CalendarNavigation } from '../сalendarNavigation';
import { SearchInput } from '../searchInput';

interface TasksControlPanelProps {
  filters: {
    view: 'list' | 'kanban' | 'calendar';
    cal: 'month' | 'week' | 'day';
    date: string;
  };
  updateFilters: (updates: Record<string, string>) => void;
  isLoadingTasks: boolean;
  isFetchingTasks: boolean;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  onCreateTask: () => void;
}

export function TasksControlPanel({
  filters,
  updateFilters,
  isFetchingTasks,
}: TasksControlPanelProps) {
  const isCalendarView = filters.view === 'calendar';

  // Функции для навигации по календарю
  const handleCalendarPrevious = () => {
    const anchor = parseISO(filters.date);
    let newDate;
    if (filters.cal === 'month') {
      newDate = subMonths(anchor, 1);
    } else if (filters.cal === 'week') {
      newDate = subWeeks(anchor, 1);
    } else {
      newDate = subDays(anchor, 1);
    }
    updateFilters({ date: format(newDate, 'yyyy-MM-dd') });
  };

  const handleCalendarNext = () => {
    const anchor = parseISO(filters.date);
    let newDate;
    if (filters.cal === 'month') {
      newDate = addMonths(anchor, 1);
    } else if (filters.cal === 'week') {
      newDate = addWeeks(anchor, 1);
    } else {
      newDate = addDays(anchor, 1);
    }
    updateFilters({ date: format(newDate, 'yyyy-MM-dd') });
  };

  const handleCalendarToday = () => {
    updateFilters({ date: format(new Date(), 'yyyy-MM-dd') });
  };

  // Метка периода для календаря
  const periodLabel = useMemo(() => {
    const anchor = parseISO(filters.date);

    if (filters.cal === 'month') {
      return format(anchor, 'LLL yyyy', { locale: ru });
    } else if (filters.cal === 'week') {
      const start = startOfWeek(anchor, { weekStartsOn: 1 });
      const end = endOfWeek(anchor, { weekStartsOn: 1 });
      return `${format(start, 'd MMM', { locale: ru })} - ${format(
        end,
        'd MMM',
        { locale: ru }
      )}`;
    } else {
      return format(anchor, 'd MMM yyyy', { locale: ru });
    }
  }, [isCalendarView, filters.date, filters.cal]);

  const { search: globalSearch, setSearch: setGlobalSearch } =
    useTaskFiltersStore();

  const [localSearch, setLocalSearch] = useState(globalSearch);
  const debouncedLocalSearch = useDebounced(localSearch, 600);
  useEffect(() => {
    setGlobalSearch(debouncedLocalSearch);
  }, [debouncedLocalSearch]);

  return (
    <div className="flex flex-col sm:flex-row items-center py-[15px] px-[30px] bg-[#FFFFFF] rounded-lg shadow-soft border border-gray-100">
      {/* Переключение видов и режимов календаря */}
      <div className="flex flex-col lg:flex-row items-center w-full gap-2 justify-between">
        {/* Переключатель видов */}
        <div className="flex border overflow-hidden rounded-md w-full sm:w-auto">
          {(['calendar', 'kanban', 'list'] as const).map((v) => (
            <button
              key={v}
              onClick={() =>
                updateFilters({
                  view: v,
                  date: format(new Date(), 'yyyy-MM-dd'),
                })
              }
              disabled={isFetchingTasks}
              className={`
                    flex-1 sm:flex-none
                    px-2 py-1.5
                    text-xs sm:text-[14px] sm: leading-[130%] sm:font-normal sm:font-roboto
                    transition-colors whitespace-nowrap text-center tracking-[-0.83px]
                ${
                  filters.view === v
                    ? 'bg-black text-white'
                    : 'bg-white hover:bg-neutral-100 text-black'
                }
                ${isFetchingTasks ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span className="hidden sm:inline">
                {v === 'list'
                  ? 'Список'
                  : v === 'kanban'
                    ? 'Канбан'
                    : 'Календарь'}
              </span>
              <span className="sm:hidden inline">
                {v === 'list'
                  ? 'Список'
                  : v === 'kanban'
                    ? 'Канбан'
                    : 'Календарь'}
              </span>
            </button>
          ))}
        </div>

        {/* Поле поиска */}
        <SearchInput
          value={localSearch}
          onChange={setLocalSearch}
          placeholder="Поиск"
          className={`
        w-[200px]
        ${filters.view === 'kanban' ? 'mr-72' : ''}
      `}
        />

        <div className="flex items-center gap-2 shrink-0">
          {filters.view === 'kanban' && (
            <button
              className={`
                    w-[95px]
                    px-2 py-1
                    text-[#666666]
                    shadow-card
                    hover:text-gray-700
                    text-sm
                    transition-colors
                  `}
            >
              Все задачи
            </button>
          )}

          {filters.view === 'list' && (
            <>
              <ModeSwitcher
                modes={[
                  { value: 'week', label: 'Неделя' },
                  { value: 'month', label: 'Месяц' },
                  { value: 'day', label: 'День' },
                ]}
                active={filters.cal}
                onChange={(v) => updateFilters({ cal: v })}
                containerClass="flex rounded-[7px] overflow-hidden shadow-soft"
                buttonClass="flex-1 px-[8px] py-[6px] text-[14px] leading-[130%] font-normal transition-colors tracking-[-0.83px]"
              />

              <CalendarNavigation
                label={periodLabel!}
                onPrev={handleCalendarPrevious}
                onNext={handleCalendarNext}
                className="font-normal text-[14px] leading-[130%] tracking-[-0.83px]"
                buttonClassName="hover:bg-neutral-100 text-[#666666]"
              />

              <DateButton
                mode={filters.cal}
                currentDate={parseISO(filters.date)}
                onClick={handleCalendarToday}
              />
            </>
          )}

          {isCalendarView && periodLabel && (
            <>
              <ModeSwitcher
                modes={[
                  { value: 'week', label: 'Неделя' },
                  { value: 'month', label: 'Месяц' },
                  { value: 'day', label: 'День' },
                ]}
                active={filters.cal}
                onChange={(v) => updateFilters({ cal: v })}
                containerClass="flex rounded-[7px] overflow-hidden shadow-soft"
                buttonClass="flex-1 px-2 py-1.5 text-[14px] leading-[130%] font-normal transition-colors tracking-[-0.83px]"
              />

              <CalendarNavigation
                label={periodLabel!}
                onPrev={handleCalendarPrevious}
                onNext={handleCalendarNext}
                className="font-normal text-[14px] leading-[130%] tracking-[-0.83px]"
                buttonClassName="hover:bg-neutral-100 text-[#666666]"
              />

              <DateButton
                mode={filters.cal}
                currentDate={parseISO(filters.date)}
                onClick={handleCalendarToday}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
