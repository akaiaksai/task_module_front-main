import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { getDisplayName } from '@/hooks/groups/useGroupsAndMembers';
import { useTaskActions } from '@/hooks/tasks/useTaskActions';
import { useOccupancy } from '@/screens/tasks/_mobile/_calendar/hooks/useOccupancy';
import { useAuthStore } from '@/store/auth';
import { getPeriodNorm } from '@/utils/time';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { Activity, ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { UserAvatar } from '../UserAvatar';
import TaskModal from '@/screens/tasks/_desktop/_tasks-modals/TaskModal';

type ViewMode = 'day' | 'week' | 'month';

type SortMode =
  | 'alphabet_asc'
  | 'alphabet_desc'
  | 'tasks_desc'
  | 'tasks_asc'
  | 'due_desc'
  | 'due_asc'
  | 'occupancy_desc'
  | 'occupancy_asc';

type OccupancyFilter = 'all' | '0-60' | '60-90' | '90-110' | '110+';

type PeriodPreset =
  | 'all'
  | 'today'
  | 'tomorrow'
  | 'current_week'
  | 'next_week'
  | 'current_month'
  | 'next_month'
  | 'custom';

type ProjectAssigneeStat = {
  userId: number;
  name: string;
  taskCount: number;
  sharePercent: number;
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function toNumberOrNull(value: ANY): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getTaskProjectKey(task: ANY): string | null {
  const projectId =
    toNumberOrNull(task?.project?.ID) ??
    toNumberOrNull(task?.PROJECT_ENTITY_ID) ??
    toNumberOrNull(task?.projectId);
  if (projectId === null) {
    return null;
  }

  const entityTypeId =
    toNumberOrNull(task?.project?.EntityTypeID) ??
    toNumberOrNull(task?.PROJECT_ENTITY_TYPE_ID) ??
    toNumberOrNull(task?.projectEntityTypeId) ??
    0;

  return `${projectId}-${entityTypeId}`;
}

function getTaskProjectTitle(task: ANY): string {
  const title =
    task?.project?.Title?.String ??
    task?.project?.Title ??
    task?.PROJECT_TITLE ??
    task?.projectTitle;

  if (typeof title === 'string' && title.trim()) {
    return title.trim();
  }

  return 'Проект';
}

function getTaskCreatorId(task: ANY): number | null {
  return (
    toNumberOrNull(task?.createdBy) ??
    toNumberOrNull(task?.CreatedBy) ??
    toNumberOrNull(task?.CREATED_BY) ??
    toNumberOrNull(task?.creatorId) ??
    null
  );
}

interface MemberItemProps {
  user: ANY;
  tasks: ANY[];
  currentDate: Date;
  viewMode: ViewMode;
  isOpen: boolean;
  isArrowExpanded: boolean;
  isToggling: boolean;
  activeTasksCount: number;
  completedTasksCount: number;
  fallbackOccupancy: number;
  projectAssigneeStatsByKey: Record<string, ProjectAssigneeStat[]>;
  onToggle: () => void;
}

interface Props {
  members: {
    user: ANY;
    tasks: ANY[];
  }[];
  currentDate: Date;
  viewMode: ViewMode;
}

function getOccupancyTextColor(percentage: number): string {
  if (percentage < 60) {
    return 'text-[#3ECF3A]';
  }
  if (percentage < 90) {
    return 'text-[#EAC543]';
  }
  if (percentage < 110) {
    return 'text-[#FF9A1A]';
  }
  return 'text-[#FF4E4E]';
}

function getTaskDueDate(task: ANY): Date | null {
  const raw = task?.dueDate ?? task?.Deadline ?? task?.DEADLINE ?? null;

  if (!raw) {
    return null;
  }

  const date = typeof raw === 'string' ? parseISO(raw) : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isTaskCompleted(task: ANY): boolean {
  const rawStatus = String(task?.status ?? task?.STATUS ?? '').toLowerCase().trim();
  return rawStatus === 'done' || rawStatus === 'completed';
}

function countTasksInRange(tasks: ANY[], currentDate: Date, viewMode: ViewMode) {
  if (viewMode === 'day') {
    const start = startOfDay(currentDate);
    const end = endOfDay(currentDate);
    return tasks.filter((task) => {
      const due = getTaskDueDate(task);
      return due ? isWithinInterval(due, { start, end }) : false;
    }).length;
  }

  if (viewMode === 'week') {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return tasks.filter((task) => {
      const due = getTaskDueDate(task);
      return due ? isWithinInterval(due, { start, end }) : false;
    }).length;
  }

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  return tasks.filter((task) => {
    const due = getTaskDueDate(task);
    return due ? isWithinInterval(due, { start, end }) : false;
  }).length;
}

function estimateOccupancy(tasks: ANY[], viewMode: ViewMode): number {
  const normSeconds = getPeriodNorm(viewMode) * 3600;
  if (normSeconds <= 0) {
    return 0;
  }

  const totalTaskSeconds = tasks.reduce((sum, task) => {
    const estimate = Number(task?.timeEstimate ?? task?.TIME_ESTIMATE ?? 0);
    return sum + (Number.isFinite(estimate) ? estimate : 0);
  }, 0);

  return Math.round((totalTaskSeconds * 100) / normSeconds);
}

function matchesOccupancyRange(
  percentage: number,
  occupancyFilter: OccupancyFilter
): boolean {
  if (occupancyFilter === 'all') {
    return true;
  }

  if (occupancyFilter === '0-60') {
    return percentage < 60;
  }

  if (occupancyFilter === '60-90') {
    return percentage >= 60 && percentage < 90;
  }

  if (occupancyFilter === '90-110') {
    return percentage >= 90 && percentage < 110;
  }

  return percentage >= 110;
}

function inPeriod(
  dueDate: Date,
  currentDate: Date,
  periodPreset: PeriodPreset,
  customRange: { start: Date; end: Date }
): boolean {
  const todayStart = startOfDay(currentDate);

  switch (periodPreset) {
    case 'all':
      return true;
    case 'today': {
      const start = todayStart;
      const end = endOfDay(currentDate);
      return isWithinInterval(dueDate, { start, end });
    }
    case 'tomorrow': {
      const tomorrow = addDays(todayStart, 1);
      return isWithinInterval(dueDate, {
        start: startOfDay(tomorrow),
        end: endOfDay(tomorrow),
      });
    }
    case 'current_week': {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return isWithinInterval(dueDate, { start, end });
    }
    case 'next_week': {
      const next = addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), 7);
      const start = startOfWeek(next, { weekStartsOn: 1 });
      const end = endOfWeek(next, { weekStartsOn: 1 });
      return isWithinInterval(dueDate, { start, end });
    }
    case 'current_month': {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return isWithinInterval(dueDate, { start, end });
    }
    case 'next_month': {
      const nextMonthDate = addDays(endOfMonth(currentDate), 1);
      const start = startOfMonth(nextMonthDate);
      const end = endOfMonth(nextMonthDate);
      return isWithinInterval(dueDate, { start, end });
    }
    case 'custom':
      return isWithinInterval(dueDate, {
        start: startOfDay(customRange.start),
        end: endOfDay(customRange.end),
      });
    default:
      return true;
  }
}

function normalizeDateRange(range: { start: Date; end: Date }) {
  if (isAfter(range.start, range.end)) {
    return { start: range.end, end: range.start };
  }

  return range;
}

function capitalizeFirst(value: string) {
  if (!value) {
    return value;
  }

  return value[0].toUpperCase() + value.slice(1);
}

function getTaskElapsedSeconds(task: ANY): number {
  if (!Array.isArray(task?.elapsed)) {
    return 0;
  }

  return task.elapsed.reduce(
    (sum: number, entry: ANY) => sum + Number(entry?.Seconds ?? 0),
    0
  );
}

function getTaskTimeStatus(task: ANY, elapsedSeconds: number) {
  const estimateSeconds = Number(task?.timeEstimate ?? task?.TIME_ESTIMATE ?? 0);
  const dueDate = getTaskDueDate(task);

  if (!dueDate || !estimateSeconds) {
    return {
      display: false,
      timeEstimateMin: 0,
      timeSpentMin: 0,
      remainingTimeByPlan: 0,
      status: '',
      statusColor: '#21C564',
    };
  }

  const now = new Date();
  const estimateMin = Math.round(estimateSeconds / 60);
  const spentMin = Math.round(elapsedSeconds / 60);
  const remainMin = Math.max(0, estimateMin - spentMin);
  const deadlineInMin = (dueDate.getTime() - now.getTime()) / 60000;

  if (deadlineInMin < 0) {
    return {
      display: true,
      timeEstimateMin: estimateMin,
      timeSpentMin: spentMin,
      remainingTimeByPlan: remainMin,
      status: 'Просрочено',
      statusColor: '#EF4642',
    };
  }

  if (remainMin > deadlineInMin) {
    return {
      display: true,
      timeEstimateMin: estimateMin,
      timeSpentMin: spentMin,
      remainingTimeByPlan: remainMin,
      status: 'Критично',
      statusColor: '#EF4642',
    };
  }

  if (remainMin > deadlineInMin * 0.7) {
    return {
      display: true,
      timeEstimateMin: estimateMin,
      timeSpentMin: spentMin,
      remainingTimeByPlan: remainMin,
      status: 'Могу не успеть',
      statusColor: '#E5B702',
    };
  }

  return {
    display: true,
    timeEstimateMin: estimateMin,
    timeSpentMin: spentMin,
    remainingTimeByPlan: remainMin,
    status: 'Все по плану',
    statusColor: '#21C564',
  };
}

function formatTaskDueDate(task: ANY): string {
  const dueDate = getTaskDueDate(task);
  if (!dueDate) {
    return 'Сдача не указана';
  }

  return `Сдача ${format(dueDate, 'dd.MM.yy - HH:mm')}`;
}

function MemberTaskCard({
  task,
  user,
  projectAssigneeStatsByKey,
  onOpenTask,
}: {
  task: ANY;
  user: ANY;
  projectAssigneeStatsByKey: Record<string, ProjectAssigneeStat[]>;
  onOpenTask: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [isUpdatingAssignee, setIsUpdatingAssignee] = useState(false);
  const switchTapAtRef = useRef(0);
  const { userId: currentUserId, isAdmin } = useAuthStore();
  const { updateTask } = useTaskActions();

  const elapsedSeconds = getTaskElapsedSeconds(task);
  const timeStatus = getTaskTimeStatus(task, elapsedSeconds);

  const creatorId = getTaskCreatorId(task);
  const canManageAssignee =
    isAdmin ||
    (creatorId !== null &&
      currentUserId !== null &&
      Number(creatorId) === Number(currentUserId));

  const projectKey = getTaskProjectKey(task);
  const projectTitle = getTaskProjectTitle(task);
  const projectAssignees = projectKey
    ? (projectAssigneeStatsByKey[projectKey] ?? [])
    : [];

  const currentTaskId = String(task?.id ?? task?.ID ?? '');
  const currentAssigneeId =
    toNumberOrNull(task?.assigneeId ?? task?.RESPONSIBLE_ID ?? user?.ID) ?? null;

  const selectableAssignees = useMemo(() => {
    const byId = new Map<number, ProjectAssigneeStat>();

    projectAssignees.forEach((item) => {
      byId.set(item.userId, item);
    });

    if (currentAssigneeId !== null && !byId.has(currentAssigneeId)) {
      byId.set(currentAssigneeId, {
        userId: currentAssigneeId,
        name: getDisplayName(user),
        taskCount: 0,
        sharePercent: 0,
      });
    }

    return Array.from(byId.values()).sort((a, b) => b.taskCount - a.taskCount);
  }, [projectAssignees, currentAssigneeId, user]);

  const handleOpenAssigneePicker = () => {
    if (!canManageAssignee) {
      toast.error('Сменить исполнителя может только постановщик задачи или админ');
      return;
    }

    setStatsOpen(false);
    setAssigneePickerOpen((prev) => !prev);
  };

  const handleSwitchClick = () => {
    const now = Date.now();
    const isDoubleTap = now - switchTapAtRef.current < 350;
    switchTapAtRef.current = now;

    if (isDoubleTap) {
      setAssigneePickerOpen(false);
      setStatsOpen((prev) => !prev);
      return;
    }

    handleOpenAssigneePicker();
  };

  const handleSelectAssignee = async (nextAssigneeId: number) => {
    if (!canManageAssignee) {
      toast.error('Сменить исполнителя может только постановщик задачи или админ');
      return;
    }

    if (!currentTaskId) {
      toast.error('Не удалось определить задачу');
      return;
    }

    if (currentAssigneeId === nextAssigneeId) {
      setAssigneePickerOpen(false);
      return;
    }

    try {
      setIsUpdatingAssignee(true);
      await updateTask({
        id: currentTaskId,
        payload: {
          RESPONSIBLE_ID: nextAssigneeId,
        },
      });
      toast.success('Исполнитель обновлен');
      setAssigneePickerOpen(false);
    } catch {
      toast.error('Не удалось сменить исполнителя');
    } finally {
      setIsUpdatingAssignee(false);
    }
  };

  return (
    <article className="relative overflow-hidden rounded-[12px] border border-[#FFFFFFCC] bg-[#F7F7F7] text-black shadow-[0_3px_14px_rgba(0,0,0,0.3)] font-roboto">
      <div className="absolute left-0 top-0 bottom-0 w-[7px] bg-[#EF4642]" />

      <div className="pl-4 pr-3 py-3">
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded px-1 text-[22px] leading-none text-[#1D2430]"
            aria-label="Действия задачи"
          >
            ...
          </button>
        </div>

        {menuOpen && (
          <div className="absolute right-3 top-10 z-20 rounded-[8px] border border-[#777] bg-[#2D2D2DEB] text-white shadow-[0_6px_16px_rgba(0,0,0,0.35)]">
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-[14px] hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              Запросить статус
            </button>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-[14px] text-[#FF7A7A] hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              Снять с проекта
            </button>
          </div>
        )}

        <button type="button" onClick={onOpenTask} className="mb-2 block text-left">
          <div className="text-[16px] leading-[130%] text-[#0E0E0E]">
            {task?.title || task?.TITLE || 'Без названия'}
          </div>
        </button>

        <div className="mb-2 flex items-center gap-2 text-[15px] text-[#1D2430]">
          <UserAvatar user={user} size="sm" />
          <span className="truncate">{getDisplayName(user)}</span>
        </div>

        {timeStatus.display && (
          <>
            <div className="text-[13px] leading-[130%] text-[#0E0E0E]">
              {timeStatus.timeEstimateMin} мин - {timeStatus.timeSpentMin} мин ={' '}
              {timeStatus.remainingTimeByPlan} мин
            </div>

            <div className="my-2 h-px bg-[#C2C2C2]" />

            <div className="flex items-center justify-between gap-2 text-[13px] leading-[130%]">
              <span className="text-[#0E0E0E]">{formatTaskDueDate(task)}</span>

              <span
                className="inline-flex items-center gap-1.5 whitespace-nowrap leading-none"
                style={{ color: timeStatus.statusColor }}
              >
                {timeStatus.status === 'Все по плану' ? (
                  <Activity size={14} strokeWidth={2.3} />
                ) : (
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: timeStatus.statusColor }}
                  />
                )}
                {timeStatus.status}
              </span>
            </div>
          </>
        )}

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAssigneePicker}
            className={`flex-1 rounded-[12px] border border-[#A8A8A8] bg-white px-3 py-2 text-left text-[12px] ${
              canManageAssignee ? 'text-[#1D2430]' : 'text-[#858C96]'
            }`}
          >
            Выбрать исполнителя
          </button>
          <button
            type="button"
            onClick={handleSwitchClick}
            className={`min-w-[124px] rounded-[12px] border border-[#8AE6FF66] bg-[#101D3D] px-4 py-2 text-[12px] text-white ${
              canManageAssignee ? '' : 'opacity-85'
            }`}
            title="Двойное нажатие откроет статистику исполнителей проекта"
          >
            Сменить
          </button>
        </div>

        {assigneePickerOpen && (
          <div className="mt-2 rounded-[10px] border border-[#A8A8A8] bg-white p-2 shadow-[0_6px_16px_rgba(0,0,0,0.18)]">
            <div className="mb-1 text-[12px] text-[#5C6575]">
              Выберите исполнителя
            </div>
            {selectableAssignees.length === 0 ? (
              <div className="px-2 py-2 text-[12px] text-[#697385]">
                Внутри проекта пока нет исполнителей
              </div>
            ) : (
              <div className="max-h-[172px] space-y-1 overflow-y-auto pr-1">
                {selectableAssignees.map((assignee) => (
                  <button
                    key={assignee.userId}
                    type="button"
                    onClick={() => handleSelectAssignee(assignee.userId)}
                    disabled={isUpdatingAssignee}
                    className={`w-full rounded-[8px] border px-2.5 py-2 text-left text-[12px] transition ${
                      currentAssigneeId === assignee.userId
                        ? 'border-[#8AE6FF99] bg-[#1431471A] text-[#1D2430]'
                        : 'border-[#D6D6D6] bg-[#FAFAFA] text-[#2B3342]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{assignee.name}</span>
                      <span className="shrink-0 text-[#667085]">
                        {assignee.taskCount}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {statsOpen && (
          <div className="mt-2 rounded-[10px] border border-[#8AE6FF66] bg-[#0E1D31] p-2.5 text-white shadow-[0_6px_16px_rgba(0,0,0,0.35)]">
            <div className="mb-2 text-[12px] text-[#D5E6F4]">
              Статистика исполнителей в проекте: {projectTitle}
            </div>
            {projectAssignees.length === 0 ? (
              <div className="text-[12px] text-[#AFC5D8]">
                Нет данных по исполнителям
              </div>
            ) : (
              <div className="space-y-1.5">
                {projectAssignees.map((item) => (
                  <div
                    key={item.userId}
                    className="flex items-center justify-between rounded-[8px] border border-[#8AE6FF26] bg-[#8AE6FF12] px-2 py-1.5 text-[12px]"
                  >
                    <span className="truncate pr-2">{item.name}</span>
                    <span className="shrink-0 tabular-nums text-[#DDEEFF]">
                      {item.taskCount} • {item.sharePercent}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
const MemberItem = memo(
  ({
    user,
    tasks,
    currentDate,
    viewMode,
    isOpen,
    isArrowExpanded,
    isToggling,
    activeTasksCount,
    completedTasksCount,
    fallbackOccupancy,
    projectAssigneeStatsByKey,
    onToggle,
  }: MemberItemProps) => {
    const occupancy = useOccupancy(user.ID, tasks, currentDate, viewMode);
    const rawOccupancyValue = occupancy
      ? Math.round(occupancy.percentage)
      : fallbackOccupancy;
    const occupancyValue = clampPercent(rawOccupancyValue);

    const [searchParams, setSearchParams] = useSearchParams();

    const openTask = (taskId: string) => {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('m', 'task');
      newSearchParams.set('id', taskId);
      setSearchParams(newSearchParams, { replace: true });
    };

    return (
      <div className="pb-3">
        <button
          onClick={onToggle}
          disabled={isToggling}
          className="w-full flex items-center justify-between rounded-[13px] border border-[#8AE6FF66] bg-[radial-gradient(128%_190%_at_60%_40%,rgba(44,102,126,0.82)_0%,rgba(21,33,56,0.95)_50%,rgba(4,6,10,1)_100%)] px-3 py-3 text-white shadow-[0_0_0_1px_rgba(138,230,255,0.2),0_0_18px_rgba(51,193,231,0.18)]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar user={user} />
            <span className="text-[18px] leading-[130%] tracking-[-0.4px] font-normal truncate">
              {getDisplayName(user)}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex flex-col items-end text-[10px] leading-[120%] text-[#9FB3C4]">
              <span>Активные {activeTasksCount}</span>
              <span>Завершенные {completedTasksCount}</span>
            </div>
            <span
              className={`text-[34px] leading-none font-medium tracking-[-0.4px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] ${getOccupancyTextColor(
                occupancyValue
              )}`}
            >
              {occupancyValue}%
            </span>
            <ChevronDown
              size={20}
              className={`text-white transition-transform duration-200 ${
                isArrowExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {isOpen && (
          <div className="mt-3 rounded-[12px] border border-[#8AE6FF66] bg-[radial-gradient(128%_190%_at_60%_40%,rgba(44,102,126,0.82)_0%,rgba(21,33,56,0.95)_50%,rgba(4,6,10,1)_100%)] px-3 pb-3 pt-2">
            <div className="mb-2 h-px bg-[#FFFFFF47]" />
            <div className="mb-3 flex justify-center">
              <button
                type="button"
                onClick={onToggle}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-[#8AE6FF80] bg-[#12283B] text-[#DDF5FF] shadow-[0_0_10px_rgba(51,193,231,0.32)]"
                aria-label="Свернуть задачи"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {tasks.map((task) => (
                <MemberTaskCard
                  key={task.id || task.ID}
                  task={task}
                  user={user}
                  projectAssigneeStatsByKey={projectAssigneeStatsByKey}
                  onOpenTask={() => openTask(String(task.id || task.ID))}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

MemberItem.displayName = 'MemberItem';

export function MobileUsersDropdown({ members, currentDate, viewMode }: Props) {
  const [openedUserId, setOpenedUserId] = useState<number | null>(null);
  const [arrowExpandedUserId, setArrowExpandedUserId] = useState<number | null>(
    null
  );
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<
    'sort' | 'occupancy' | 'period' | null
  >(null);
  const [sortMode, setSortMode] = useState<SortMode>('alphabet_asc');
  const [occupancyFilter, setOccupancyFilter] =
    useState<OccupancyFilter>('all');
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('all');
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date }>({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });
  const [draftCustomRange, setDraftCustomRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    startOfMonth(currentDate)
  );
  const [showCustomPeriod, setShowCustomPeriod] = useState(false);
  const [isSelectingRangeEnd, setIsSelectingRangeEnd] = useState(false);

  const filtersRef = useClickOutside(() => setActiveDropdown(null));

  const resetAllFilters = () => {
    setSearchTerm('');
    setSortMode('alphabet_asc');
    setOccupancyFilter('all');
    setPeriodPreset('all');
    setShowCustomPeriod(false);
    const defaultRange = {
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate),
    };
    setCustomRange(defaultRange);
    setDraftCustomRange(defaultRange);
    setCalendarMonth(startOfMonth(currentDate));
    setIsSelectingRangeEnd(false);
    setActiveDropdown(null);
    setOpenedUserId(null);
    setArrowExpandedUserId(null);
    setTogglingUserId(null);
  };

  const openCustomPeriodPicker = () => {
    setPeriodPreset('custom');
    setShowCustomPeriod((prev) => {
      const next = !prev;
      if (next) {
        setDraftCustomRange(customRange);
        setCalendarMonth(startOfMonth(customRange.start));
        setIsSelectingRangeEnd(false);
      }
      return next;
    });
  };

  const normalizedDraftRange = useMemo(
    () => normalizeDateRange(draftCustomRange),
    [draftCustomRange]
  );

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });
  }, [calendarMonth]);

  const calendarWeeks = useMemo(() => {
    const weeks: Date[][] = [];

    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }

    return weeks;
  }, [calendarDays]);

  const pickRangeDate = (date: Date) => {
    if (!isSelectingRangeEnd) {
      setDraftCustomRange({ start: date, end: date });
      setIsSelectingRangeEnd(true);
      return;
    }

    setDraftCustomRange((prev) => {
      if (isBefore(date, prev.start)) {
        return { start: date, end: prev.start };
      }

      return { start: prev.start, end: date };
    });
    setIsSelectingRangeEnd(false);
  };

  const applyCustomPeriod = () => {
    const normalized = normalizeDateRange(draftCustomRange);
    setCustomRange(normalized);
    setPeriodPreset('custom');
    setShowCustomPeriod(false);
    setActiveDropdown(null);
  };

  const toggleMember = (userId: number) => {
    if (togglingUserId !== null) {
      return;
    }

    const isOpening = openedUserId !== userId;

    if (isOpening && openedUserId !== null && openedUserId !== userId) {
      setOpenedUserId(null);
    }

    setArrowExpandedUserId(isOpening ? userId : null);
    setTogglingUserId(userId);

    window.setTimeout(() => {
      setOpenedUserId((prev) => {
        if (isOpening) {
          return userId;
        }

        return prev === userId ? null : prev;
      });
      setTogglingUserId(null);
    }, 180);
  };

  const projectAssigneeStatsByKey = useMemo(() => {
    const displayNameById = new Map<number, string>();
    members.forEach(({ user }) => {
      const userId = toNumberOrNull(user?.ID);
      if (userId !== null && !displayNameById.has(userId)) {
        displayNameById.set(userId, getDisplayName(user));
      }
    });

    const projectStats = new Map<
      string,
      {
        totalTasks: number;
        assignees: Map<number, ProjectAssigneeStat>;
      }
    >();

    members.forEach(({ tasks }) => {
      tasks.forEach((task) => {
        const projectKey = getTaskProjectKey(task);
        const assigneeId =
          toNumberOrNull(task?.assigneeId ?? task?.RESPONSIBLE_ID) ?? null;

        if (!projectKey || assigneeId === null) {
          return;
        }

        if (!projectStats.has(projectKey)) {
          projectStats.set(projectKey, {
            totalTasks: 0,
            assignees: new Map<number, ProjectAssigneeStat>(),
          });
        }

        const bucket = projectStats.get(projectKey)!;
        bucket.totalTasks += 1;

        if (!bucket.assignees.has(assigneeId)) {
          bucket.assignees.set(assigneeId, {
            userId: assigneeId,
            name:
              displayNameById.get(assigneeId) ||
              String(task?.assigneeName || '').trim() ||
              `Сотрудник #${assigneeId}`,
            taskCount: 0,
            sharePercent: 0,
          });
        }

        bucket.assignees.get(assigneeId)!.taskCount += 1;
      });
    });

    const normalized: Record<string, ProjectAssigneeStat[]> = {};
    projectStats.forEach((project, key) => {
      const total = project.totalTasks || 1;
      normalized[key] = Array.from(project.assignees.values())
        .map((item) => ({
          ...item,
          sharePercent: Math.round((item.taskCount * 100) / total),
        }))
        .sort((a, b) => b.taskCount - a.taskCount);
    });

    return normalized;
  }, [members]);

  const processedMembers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const rows = members
      .map(({ user, tasks }) => {
        const periodFilteredTasks = tasks.filter((task) => {
          const due = getTaskDueDate(task);
          if (!due) {
            return periodPreset === 'all';
          }

          return inPeriod(due, currentDate, periodPreset, customRange);
        });

        const userName = getDisplayName(user);
        const titleMatch = periodFilteredTasks.some((task) =>
          String(task?.title || task?.TITLE || '')
            .toLowerCase()
            .includes(normalizedSearch)
        );

        const taskCount = countTasksInRange(
          periodFilteredTasks,
          currentDate,
          viewMode
        );
        const completedTasksCount = periodFilteredTasks.filter(isTaskCompleted).length;
        const activeTasksCount = Math.max(
          0,
          periodFilteredTasks.length - completedTasksCount
        );

        const occupancy = estimateOccupancy(periodFilteredTasks, viewMode);

        const nearestDueDate = periodFilteredTasks
          .map((task) => getTaskDueDate(task))
          .filter((date): date is Date => Boolean(date))
          .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;

        return {
          user,
          tasks: periodFilteredTasks,
          userName,
          titleMatch,
          taskCount,
          activeTasksCount,
          completedTasksCount,
          occupancy,
          nearestDueDate,
        };
      })
      .filter((row) => {
        if (
          normalizedSearch &&
          !row.userName.toLowerCase().includes(normalizedSearch) &&
          !row.titleMatch
        ) {
          return false;
        }

        if (!matchesOccupancyRange(row.occupancy, occupancyFilter)) {
          return false;
        }

        if (periodPreset !== 'all' && row.tasks.length === 0) {
          return false;
        }

        return row.tasks.length > 0;
      });

    rows.sort((a, b) => {
      switch (sortMode) {
        case 'alphabet_desc':
          return b.userName.localeCompare(a.userName, 'ru', {
            sensitivity: 'base',
          });
        case 'tasks_desc':
          return b.taskCount - a.taskCount;
        case 'tasks_asc':
          return a.taskCount - b.taskCount;
        case 'due_desc': {
          const aTime = a.nearestDueDate?.getTime() ?? -Infinity;
          const bTime = b.nearestDueDate?.getTime() ?? -Infinity;
          return bTime - aTime;
        }
        case 'due_asc': {
          const aTime = a.nearestDueDate?.getTime() ?? Infinity;
          const bTime = b.nearestDueDate?.getTime() ?? Infinity;
          return aTime - bTime;
        }
        case 'occupancy_desc':
          return b.occupancy - a.occupancy;
        case 'occupancy_asc':
          return a.occupancy - b.occupancy;
        case 'alphabet_asc':
        default:
          return a.userName.localeCompare(b.userName, 'ru', {
            sensitivity: 'base',
          });
      }
    });

    return rows;
  }, [
    members,
    currentDate,
    viewMode,
    searchTerm,
    occupancyFilter,
    periodPreset,
    customRange,
    sortMode,
  ]);

  useEffect(() => {
    if (togglingUserId !== null) {
      return;
    }

    if (openedUserId === null) {
      setArrowExpandedUserId(null);
      return;
    }

    const isOpenedUserVisible = processedMembers.some(
      (member) => member.user.ID === openedUserId
    );

    if (!isOpenedUserVisible) {
      setOpenedUserId(null);
      setArrowExpandedUserId(null);
    }
  }, [openedUserId, processedMembers, togglingUserId]);

  useEffect(() => {
    if (activeDropdown === 'period') {
      return;
    }

    setShowCustomPeriod(false);
    setIsSelectingRangeEnd(false);
  }, [activeDropdown]);

  return (
    <div className="overflow-hidden font-roboto">
      <div ref={filtersRef} className="relative mb-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Поиск"
              className="h-[44px] w-full rounded-[12px] border border-[#A9A9A9] bg-white px-4 pr-11 text-[17px] text-[#1D2430] placeholder:text-[#7E838A] outline-none"
            />
            <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2F3745]" />
          </div>
          <button
            type="button"
            onClick={resetAllFilters}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-[#A9A9A9] bg-[#F5F5F5] text-[#7E838A]"
            aria-label="Сбросить фильтры"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() =>
              setActiveDropdown((prev) => (prev === 'sort' ? null : 'sort'))
            }
            className="h-[44px] rounded-[12px] border border-[#A9A9A9] bg-[#F7F7F7] text-[14px] text-[#666A70]"
          >
            Сортировка
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveDropdown((prev) =>
                prev === 'occupancy' ? null : 'occupancy'
              )
            }
            className="h-[44px] rounded-[12px] border border-[#A9A9A9] bg-[#F7F7F7] text-[14px] text-[#666A70]"
          >
            Занятость
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveDropdown((prev) => (prev === 'period' ? null : 'period'))
            }
            className="h-[44px] rounded-[12px] border border-[#A9A9A9] bg-[#F7F7F7] text-[14px] text-[#666A70]"
          >
            Период
          </button>
        </div>

        {activeDropdown === 'sort' && (
          <div className="absolute left-0 top-[98px] z-30 w-[76%] rounded-[12px] border border-[#B6B6B6] bg-[#ECECEC] p-3 shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
            {[
              ['alphabet_asc', 'Алфавит А-Я', '↑'],
              ['alphabet_desc', 'Алфавит Я-А', '↓'],
              ['tasks_desc', 'Задачи', '↑'],
              ['tasks_asc', 'Задачи', '↓'],
              ['due_desc', 'Срок', '↑'],
              ['due_asc', 'Срок', '↓'],
              ['occupancy_desc', 'Занятость', '↑'],
              ['occupancy_asc', 'Занятость', '↓'],
            ].map(([value, label, icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSortMode(value as SortMode);
                  setActiveDropdown(null);
                }}
                className="flex w-full items-center justify-between border-b border-[#CFCFCF] px-1 py-2 text-left text-[17px] text-[#1D2430] last:border-b-0"
              >
                <span>{label}</span>
                <span className="text-[26px] leading-none text-[#2B3342]">
                  {icon}
                </span>
              </button>
            ))}
          </div>
        )}

        {activeDropdown === 'occupancy' && (
          <div className="absolute left-[30%] top-[98px] z-30 w-[38%] rounded-[12px] border border-[#B6B6B6] bg-[#ECECEC] p-3 shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
            <div className="mb-2 text-[34px] leading-none text-[#1D2430]">Занятость</div>
            {[
              ['0-60', '0-60%', '#53C41A'],
              ['60-90', '60-90%', '#E5B702'],
              ['90-110', '90-110%', '#E57002'],
              ['110+', '110% +', '#EF4642'],
            ].map(([value, label, color]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setOccupancyFilter(value as OccupancyFilter);
                  setActiveDropdown(null);
                }}
                className="flex w-full items-center gap-3 px-1 py-2 text-left text-[35px] leading-none text-[#1D2430]"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}

        {activeDropdown === 'period' && (
          <div className="absolute right-0 top-[98px] z-30 w-[70%] rounded-[12px] border border-[#B6B6B6] bg-[#ECECEC] p-3 shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
            <div className="grid grid-cols-2 gap-2 text-[18px] text-[#101418]">
              <button
                type="button"
                onClick={() => {
                  setPeriodPreset('today');
                  setActiveDropdown(null);
                }}
                className="text-left"
              >
                Сегодня
              </button>
              <button
                type="button"
                onClick={() => {
                  setPeriodPreset('tomorrow');
                  setActiveDropdown(null);
                }}
                className="text-right"
              >
                Завтра
              </button>
              <button
                type="button"
                onClick={() => {
                  setPeriodPreset('current_week');
                  setActiveDropdown(null);
                }}
                className="text-left"
              >
                Текущая неделя
              </button>
              <button
                type="button"
                onClick={() => {
                  setPeriodPreset('next_week');
                  setActiveDropdown(null);
                }}
                className="text-right"
              >
                Следующая неделя
              </button>
              <button
                type="button"
                onClick={() => {
                  setPeriodPreset('current_month');
                  setActiveDropdown(null);
                }}
                className="text-left"
              >
                Текущий месяц
              </button>
              <button
                type="button"
                onClick={() => {
                  setPeriodPreset('next_month');
                  setActiveDropdown(null);
                }}
                className="text-right"
              >
                Следующий месяц
              </button>
            </div>

            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={openCustomPeriodPicker}
                className="text-[18px] text-[#5D6168] underline"
              >
                Период
              </button>
            </div>

            {showCustomPeriod && (
              <div className="mt-3 rounded-[16px] border border-[#8AE6FF66] bg-[radial-gradient(128%_190%_at_60%_40%,rgba(96,94,64,0.85)_0%,rgba(47,53,40,0.92)_50%,rgba(30,31,22,1)_100%)] p-3 text-white">
                <div className="mb-3 flex items-center justify-between border-b border-white/15 pb-2 text-[17px]">
                  <span>От {format(normalizedDraftRange.start, 'dd.MM.yyyy')}</span>
                  <span>До {format(normalizedDraftRange.end, 'dd.MM.yyyy')}</span>
                </div>

                <div className="mb-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCalendarMonth((prev) => addMonths(prev, -1))}
                    className="h-7 w-7 rounded-full border border-white/25 text-center text-[18px] leading-none"
                    aria-label="Предыдущий месяц"
                  >
                    ‹
                  </button>
                  <div className="text-[16px]">
                    {capitalizeFirst(format(calendarMonth, 'LLLL yyyy', { locale: ru }))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))}
                    className="h-7 w-7 rounded-full border border-white/25 text-center text-[18px] leading-none"
                    aria-label="Следующий месяц"
                  >
                    ›
                  </button>
                </div>

                <div className="mb-2 grid grid-cols-7 text-center text-[12px] text-white/70">
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarWeeks.map((week, weekIndex) =>
                    week.map((day, dayIndex) => {
                      const isCurrentMonth = isSameMonth(day, calendarMonth);
                      const isSelectedStart = isSameDay(
                        day,
                        normalizedDraftRange.start
                      );
                      const isSelectedEnd = isSameDay(day, normalizedDraftRange.end);
                      const isInSelectedRange = isWithinInterval(day, {
                        start: startOfDay(normalizedDraftRange.start),
                        end: endOfDay(normalizedDraftRange.end),
                      });

                      return (
                        <button
                          key={`${weekIndex}-${dayIndex}`}
                          type="button"
                          onClick={() => pickRangeDate(day)}
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] transition ${
                            isSelectedStart || isSelectedEnd
                              ? 'bg-[#49B9FF] text-[#0A1A27]'
                              : isInSelectedRange
                                ? 'bg-[#FFFFFF33] text-white'
                                : isCurrentMonth
                                  ? 'text-white'
                                  : 'text-white/35'
                          }`}
                        >
                          {format(day, 'd')}
                        </button>
                      );
                    })
                  )}
                </div>

                <button
                  type="button"
                  onClick={applyCustomPeriod}
                  className="mt-3 text-[16px] underline"
                >
                  Сохранить
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {processedMembers.length === 0 ? (
        <div className="rounded-[14px] border border-[#CBCBCB] bg-[#F3F3F3] px-4 py-6 text-center text-[15px] text-[#6D7380]">
          По заданным фильтрам ничего не найдено
        </div>
      ) : (
        processedMembers.map(
          ({ user, tasks, activeTasksCount, completedTasksCount, occupancy }) => (
          <MemberItem
            key={user.ID}
            user={user}
            tasks={tasks}
            currentDate={currentDate}
            viewMode={viewMode}
            isOpen={openedUserId === user.ID}
            isArrowExpanded={arrowExpandedUserId === user.ID}
            isToggling={togglingUserId === user.ID}
            activeTasksCount={activeTasksCount}
            completedTasksCount={completedTasksCount}
            fallbackOccupancy={occupancy}
            projectAssigneeStatsByKey={projectAssigneeStatsByKey}
            onToggle={() => toggleMember(user.ID)}
          />
          )
        )
      )}

      <TaskModal />
    </div>
  );
}
