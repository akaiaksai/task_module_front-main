import { ChevronDown, Star } from 'lucide-react';
import { Group } from '../../../lib/api/group';
import { getGroupColor } from '../../../screens/tasks/_mobile/_calendar/utils/colors';
import { useTaskFiltersStore } from '../../../store/task-filters';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '@/lib/api/users';

interface SidebarTaskProps {
  groups: Group[];
  isLoading: boolean;
  selectedGroupIds: number[];
  toggleGroupFilter: (groupId: number) => void;
}

export function SidebarTask({
  groups,
  isLoading,
  selectedGroupIds,
  toggleGroupFilter,
}: SidebarTaskProps) {
  const {
    status: filterStatus,
    setStatus: setFilterStatus,
    setOnlyMyTasks,
    setOnlyAuditor,
    setOnlyAccomplice,
    setOnlyCreator,
    setSearch,
    setPeriod,
    assigneeIds,
    toggleAssigneeId,
    clearAssignees,
  } = useTaskFiltersStore();

  // const toggleDeferredFilter = () => {
  //   if (filterStatus === '6') {
  //     setFilterStatus('-5');
  //     setOnlyMyTasks(false);
  //     setOnlyAuditor(false);
  //     setOnlyAccomplice(false);
  //     setOnlyCreator(false);
  //   } else {
  //     setFilterStatus('6');
  //     setOnlyMyTasks(false);
  //     setOnlyAuditor(false);
  //     setOnlyAccomplice(false);
  //     setOnlyCreator(false);
  //     setSearch('');
  //     setPeriod('');
  //   }
  // };

  const [assigneesOpen, setAssigneesOpen] = useState(false);
  const [assigneeQuery, setAssigneeQuery] = useState('');

  const { data: usersData, isFetching } = useQuery({
    queryKey: ['users-filter', assigneeQuery],
    queryFn: () => fetchUsers(assigneeQuery.trim()),
    enabled: assigneesOpen,
    staleTime: 5 * 60 * 1000,
  });

  const users = (usersData as ANY)?.result ?? [];

  function getString(v: ANY): string {
    if (!v) {
      return '';
    }

    if (typeof v === 'string') {
      return v;
    }

    if (typeof v === 'object') {
      const str = v.String ?? v.string;
      const valid = v.Valid ?? v.valid;

      if (typeof str === 'string' && (valid === true || valid === undefined)) {
        return str;
      }
    }

    return '';
  }

  function getUserLabel(u: ANY): string {
    const first = getString(u?.Name ?? u?.name);
    const last = getString(u?.LastName ?? u?.lastName);

    const fullName = [last, first].filter(Boolean).join(' ').trim();

    return fullName || `User #${u?.ID ?? u?.id ?? '?'}`;
  }

  const onlyMyTasks = useTaskFiltersStore((s) => s.onlyMyTasks);

  const toggleCompletedFilter = () => {
    if (filterStatus === '5') {
      setFilterStatus('-5');
      setOnlyMyTasks(false);
      setOnlyAuditor(false);
      setOnlyAccomplice(false);
      setOnlyCreator(false);
    } else {
      setFilterStatus('5');
      setOnlyMyTasks(false);
      setOnlyAuditor(false);
      setOnlyAccomplice(false);
      setOnlyCreator(false);
      setSearch('');
      setPeriod('');
    }
  };

  const toggleMyTasks = () => {
    setOnlyMyTasks(!onlyMyTasks);
    setOnlyAuditor(false);
    setOnlyAccomplice(false);
    setOnlyCreator(false);
    clearAssignees();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="mt-1 text-xs text-gray-500">Загрузка...</span>
      </div>
    );
  }

  const sortedGroups = groups
    .slice()
    .sort((a, b) => a.Name.localeCompare(b.Name, 'ru'));

  return (
    <aside
      className="
        flex-shrink-0
        w-[150px]
        min-h-[100%]
        hidden md:flex flex-col
    "
    >
      {/* Верхняя часть - скроллируемый список групп */}
      <div className="flex-1 min-h-0">
        <div className="space-y-4">
          {sortedGroups.map((group) => {
            const groupColor = getGroupColor(group.ID);
            const isSelected = selectedGroupIds.includes(group.ID);

            return (
              <button
                key={group.ID}
                onClick={() => toggleGroupFilter(group.ID)}
                className={`
                  group relative flex items-center gap-2 pr-[25px] pl-4 py-2.5 rounded-md border-[0.5px] transition-all duration-150 text-sm font-medium w-full text-left bg-neutral-50
                  ${
                    isSelected
                      ? `${groupColor.border} ${groupColor.text}`
                      : 'bg-neutral-50 text-black hover:bg-gray-100'
                  }
                `}
                style={
                  isSelected
                    ? {
                        backgroundColor: groupColor.bg,
                        borderColor: groupColor.border,
                      }
                    : {}
                }
                title={group.Name}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 translate-y-[-1px]"
                  style={{
                    backgroundColor: groupColor.border,
                  }}
                />
                <span
                  className="truncate text-[12px] font-normal leading-[130%]"
                  style={isSelected ? { color: groupColor.text } : {}}
                >
                  {group.Name}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative mt-4">
          <button
            onClick={() => setAssigneesOpen((v) => !v)}
            className="
      flex items-center justify-between
      pl-4 pr-2 py-2 rounded-md w-full
      bg-neutral-100 hover:bg-neutral-200 transition
    "
          >
            <span className="text-[12px]">
              Исполнители
              {assigneeIds.length > 0 && (
                <span className="ml-1 text-[11px] text-gray-500">
                  ({assigneeIds.length})
                </span>
              )}
            </span>
            <ChevronDown
              className={`h-3 w-3 transition ${
                assigneesOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {assigneesOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-white border rounded-md shadow-md z-10 max-h-60 overflow-auto">
              <input
                value={assigneeQuery}
                onChange={(e) => setAssigneeQuery(e.target.value)}
                placeholder="Найти сотрудника…"
                className="w-full px-3 py-2 text-[12px] outline-none border-b"
              />

              {isFetching && (
                <div className="px-3 py-2 text-[12px] text-gray-400">
                  Загрузка…
                </div>
              )}

              {!isFetching &&
                users.map((u: ANY) => {
                  const id = u?.id ?? u?.ID;
                  if (typeof id !== 'number') {
                    return null;
                  }

                  const label = getUserLabel(u);
                  const checked = assigneeIds.includes(id);

                  return (
                    <button
                      key={id}
                      onClick={() => {
                        toggleAssigneeId(id);
                        setOnlyMyTasks(false);
                      }}
                      className="
                w-full flex items-center gap-2
                px-3 py-2 text-left text-[12px]
                hover:bg-neutral-100
              "
                    >
                      <div
                        className={`w-3 h-3 rounded border shrink-0 ${
                          checked ? 'bg-black border-black' : 'border-gray-400'
                        }`}
                      />
                      <span>{label}</span>
                    </button>
                  );
                })}

              {assigneeIds.length > 0 && (
                <button
                  onClick={clearAssignees}
                  className="w-full px-3 py-2 text-left text-[11px] text-gray-500 hover:bg-neutral-50"
                >
                  Сбросить
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 mt-4">
        {/* Кнопка отложенных задач */}
        {/* <button
          onClick={toggleDeferredFilter}
          className={`
              flex items-center justify-between
              pr-[25px] pl-4 py-2.5 rounded-md
              transition-all duration-150
              w-full text-left hover:shadow-sm
              ${
                filterStatus === '6'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-[#E8E8E8] border-gray-200 text-[#A1A1A1] hover:bg-gray-200'
              }
            `}
        >
          <div className="flex items-center gap-2 min-w-0">
            {filterStatus === '6' ? (
              <Star className="h-3 w-3 fill-amber-300 text-amber-500 translate-y-[-1px]" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-[#A1A1A1] flex-shrink-0 translate-y-[-1px]" />
            )}
            <span className="truncate text-[12px] font-normal leading-[130%]">
              Отложенные
            </span>
          </div>
        </button> */}

        <button
          onClick={toggleMyTasks}
          className={`
            flex items-center gap-2 pl-4 py-2 rounded-md w-full transition
            ${
              onlyMyTasks
                ? 'bg-black text-white'
                : 'bg-neutral-100 hover:bg-neutral-200'
            }
          `}
        >
          <div
            className={`w-3 h-3 rounded-full ${
              onlyMyTasks ? 'bg-white' : 'bg-black'
            }`}
          />
          <span className="text-[12px]">Мои</span>
        </button>

        {/* Кнопка завершенных задач */}
        <button
          onClick={toggleCompletedFilter}
          className={`
              flex items-center justify-between pl-4 py-2.5 rounded-md
              transition-all duration-150
              w-full text-left hover:shadow-sm
              ${
                filterStatus === '5'
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-[#E8E8E8] border-gray-200 text-[#A1A1A1] hover:bg-gray-200'
              }
            `}
        >
          <div className="flex items-center gap-2 min-w-0">
            {filterStatus === '5' ? (
              <Star className="h-3 w-3 fill-amber-300 text-amber-500 translate-y-[-1px]" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-[#A1A1A1] flex-shrink-0 translate-y-[-1px]" />
            )}
            <span className="truncate text-[12px] font-normal leading-[130%]">
              Завершённые
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
}
