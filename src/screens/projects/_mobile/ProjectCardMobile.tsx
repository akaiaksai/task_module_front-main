import { UserAvatar } from '@/screens/groups/UserAvatar';
import {
  Bolt,
  ChevronDown,
  Flag,
  Search,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { getPeriodNorm } from '@/utils/time';
import { format } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useGroups } from '../../../hooks/groups/useGroup';
import { ProjectWithTasks } from '../../../hooks/groups/useProjectsWithTasks';
import { useUserLocal } from '../../../hooks/users/useUserLocal';
import { Task } from '../../../shared/types/task';
import { ProjectTaskItem } from './ProjectTaskItem';

interface ProjectCardMobileProps {
  project: ProjectWithTasks;
  isAdmin: boolean;
  userId: number | null;
  elapsedTimesMap?: Record<number, number>;
}

type ProgressAssigneeRow = {
  key: string;
  userId: number | null;
  name: string;
  percent: number;
};

type ProgressMetric = 'completion' | 'workload';

const DAY_NORM_SECONDS = getPeriodNorm('day') * 3600;

const ASSIGNEE_COLORS = [
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
  '#A855F7',
  '#D946EF',
  '#0EA5E9',
  '#64748B',
  '#14B8A6',
];

const assigneeColorCache = new Map<number, string>();

const PROJECT_GROUP_COLOR_KEYWORDS: Array<{ match: string[]; color: string }> = [
  { match: ['интегратор'], color: '#3158FF' },
  { match: ['программист'], color: '#006C5A' },
  { match: ['дизайнер'], color: '#FF4B4B' },
  { match: ['документ'], color: '#A138FF' },
  { match: ['маркетинг'], color: '#C74A86' },
  { match: ['оплаты', 'оплата'], color: '#000000' },
  { match: ['промежуточные'], color: '#FF18D6' },
  { match: ['прочее'], color: '#8A8A8A' },
  { match: ['руководств'], color: '#B0C400' },
  { match: ['тех.поддерж', 'техподдерж', 'поддержк'], color: '#7F7AC1' },
  { match: ['встреч'], color: '#4A748A' },
  { match: ['история продаж'], color: '#4A82E8' },
];

const DEFAULT_PROJECT_GROUP_COLORS = [
  '#3158FF',
  '#F0C300',
  '#FF4B4B',
  '#A138FF',
  '#4A82E8',
  '#25B6A8',
  '#8F8F8F',
];

function getProjectGroupProgressColor(groupName: string, groupId: number) {
  const normalized = groupName.toLowerCase();
  const matched = PROJECT_GROUP_COLOR_KEYWORDS.find(({ match }) =>
    match.some((needle) => normalized.includes(needle))
  );

  if (matched) {
    return matched.color;
  }

  return DEFAULT_PROJECT_GROUP_COLORS[
    Math.abs(groupId) % DEFAULT_PROJECT_GROUP_COLORS.length
  ];
}

function getTaskEstimateSeconds(task: Task): number {
  const seconds = Number(task.timeEstimate ?? 0);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
}

function buildAssigneeProgressRows(
  tasks: Task[],
  getDisplayNameById: (id: number | null) => string,
  metric: ProgressMetric
): ProgressAssigneeRow[] {
  if (!tasks.length) {
    return [];
  }

  const byAssignee = new Map<
    string,
    {
      key: string;
      userId: number | null;
      name: string;
      doneCount: number;
      totalCount: number;
      estimateSeconds: number;
    }
  >();

  tasks.forEach((task) => {
    const assigneeId =
      typeof task.assigneeId === 'number' && Number.isFinite(task.assigneeId)
        ? task.assigneeId
        : null;
    const mapKey = assigneeId === null ? 'unassigned' : `user-${assigneeId}`;

    if (!byAssignee.has(mapKey)) {
      const displayNameFromMap =
        assigneeId !== null ? getDisplayNameById(assigneeId)?.trim() : '';
      const displayNameFromTask =
        typeof task.assigneeName === 'string' ? task.assigneeName.trim() : '';

      byAssignee.set(mapKey, {
        key: mapKey,
        userId: assigneeId,
        name: displayNameFromMap || displayNameFromTask || 'Не назначен',
        doneCount: 0,
        totalCount: 0,
        estimateSeconds: 0,
      });
    }

    const stat = byAssignee.get(mapKey)!;
    stat.totalCount += 1;
    stat.estimateSeconds += getTaskEstimateSeconds(task);

    if (task.status === 'done') {
      stat.doneCount += 1;
    }
  });

  return Array.from(byAssignee.values())
    .map((stat) => {
      let percent = 0;

      if (metric === 'completion') {
        const total = stat.totalCount || 1;
        percent = Math.round((stat.doneCount * 100) / total);
        percent = Math.max(0, Math.min(100, percent));
      } else {
        percent =
          DAY_NORM_SECONDS > 0
            ? Math.max(0, Math.round((stat.estimateSeconds * 100) / DAY_NORM_SECONDS))
            : 0;
      }

      return {
        key: stat.key,
        userId: stat.userId,
        name: stat.name,
        percent,
      };
    })
    .sort((a, b) => b.percent - a.percent);
}

export const getAssigneeColor = (assigneeId: number | null | undefined) => {
  if (assigneeId === null || assigneeId === undefined) {
    return ASSIGNEE_COLORS[0];
  }

  if (assigneeColorCache.has(assigneeId)) {
    return assigneeColorCache.get(assigneeId)!;
  }

  let hash = 0;
  const assigneeIdStr = assigneeId.toString();
  for (let i = 0; i < assigneeIdStr.length; i++) {
    hash = assigneeIdStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % ASSIGNEE_COLORS.length;
  const color = ASSIGNEE_COLORS[index];
  assigneeColorCache.set(assigneeId, color);
  return color;
};

export const ProjectCardMobile = ({
  project,
}: ProjectCardMobileProps) => {
  const [isTasksExpanded, setIsTasksExpanded] = useState(true);
  const [isArrowExpanded, setIsArrowExpanded] = useState(true);
  const [isTogglingTasks, setIsTogglingTasks] = useState(false);
  const [openedProgressKeys, setOpenedProgressKeys] = useState<Set<string>>(
    () => new Set(['overall-progress'])
  );
  const toggleTimerRef = useRef<number | null>(null);

  const projectTasks = (project.tasks || []) as Task[];
  const projectTitle = project.Title?.String?.trim() || `Проект #${project.ID}`;

  const calculateTaskProgress = (tasks: Task[]) => {
    if (!tasks || !tasks.length) {
      return { progress: 0, completed: 0, total: 0 };
    }
    const completed = tasks.filter((t) => t.status === 'done').length;
    const total = tasks.length;
    return {
      progress: Math.round((completed / total) * 100),
      completed,
      total,
    };
  };

  const taskProgressData = calculateTaskProgress(projectTasks);
  const { groups: groupsData = [] } = useGroups();
  const { getDisplayNameById, getUserById } = useUserLocal.useUsersMap();

  const leadAssigneeId = useMemo(
    () => projectTasks.find((task) => task.assigneeId)?.assigneeId ?? null,
    [projectTasks]
  );

  const leadUser = leadAssigneeId ? getUserById(leadAssigneeId) : undefined;
  const leadName = leadAssigneeId
    ? getDisplayNameById(leadAssigneeId)
    : 'Без ведущего';

  const tasksByGroup = useMemo(() => {
    const groups: Record<
      number,
      {
        groupId: number;
        groupName: string;
        totalTasks: number;
        completedTasks: number;
        totalEstimateSeconds: number;
        progress: number;
        color: string;
      }
    > = {};

    const safeGroupsData = Array.isArray(groupsData) ? groupsData : [];

    projectTasks.forEach((task: Task) => {
      if (task.status === 'done') {
        return;
      }

      const groupId = task.groupId;
      if (!groupId) {
        return;
      }

      const group = safeGroupsData.find((g) => g.ID === groupId);
      const groupName = group?.Name || `Группа ${groupId}`;

      if (!groups[groupId]) {
        groups[groupId] = {
          groupId,
          groupName,
          totalTasks: 0,
          completedTasks: 0,
          totalEstimateSeconds: 0,
          progress: 0,
          color: getProjectGroupProgressColor(groupName, groupId),
        };
      }

      groups[groupId].totalTasks++;
      groups[groupId].totalEstimateSeconds += getTaskEstimateSeconds(task);
    });

    Object.values(groups).forEach((group) => {
      if (DAY_NORM_SECONDS <= 0) {
        group.progress = 0;
        return;
      }

      group.progress = Math.max(
        0,
        Math.round((group.totalEstimateSeconds * 100) / DAY_NORM_SECONDS)
      );
    });

    return Object.values(groups).sort((a, b) => b.totalTasks - a.totalTasks);
  }, [projectTasks, groupsData]);

  const activeProjectTasks = useMemo(
    () => projectTasks.filter((task) => task.status !== 'done'),
    [projectTasks]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false);
  const [dueSortMode, setDueSortMode] = useState<'due_asc' | 'due_desc'>(
    'due_asc'
  );
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | null>(
    null
  );

  const filterMenuRef = useClickOutside(() => {
    setSortMenuOpen(false);
    setAssigneeMenuOpen(false);
  });

  const overallProgressUsers = useMemo(
    () => buildAssigneeProgressRows(activeProjectTasks, getDisplayNameById, 'completion'),
    [activeProjectTasks, getDisplayNameById]
  );

  const groupProgressUsersByGroup = useMemo(() => {
    const statsByGroup: Record<number, ProgressAssigneeRow[]> = {};

    tasksByGroup.forEach((group) => {
      const groupTasks = activeProjectTasks.filter(
        (task) => task.groupId === group.groupId
      );
      statsByGroup[group.groupId] = buildAssigneeProgressRows(
        groupTasks,
        getDisplayNameById,
        'workload'
      );
    });

    return statsByGroup;
  }, [activeProjectTasks, tasksByGroup, getDisplayNameById]);

  const assigneeOptions = useMemo(() => {
    const byId = new Map<number, string>();

    activeProjectTasks.forEach((task) => {
      if (typeof task.assigneeId !== 'number') {
        return;
      }

      if (byId.has(task.assigneeId)) {
        return;
      }

      const displayNameFromMap = getDisplayNameById(task.assigneeId).trim();
      const displayNameFromTask =
        typeof task.assigneeName === 'string' ? task.assigneeName.trim() : '';
      byId.set(
        task.assigneeId,
        displayNameFromMap || displayNameFromTask || `Сотрудник #${task.assigneeId}`
      );
    });

    return Array.from(byId.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }));
  }, [activeProjectTasks, getDisplayNameById]);

  const filteredAndSortedTasks = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    let rows = activeProjectTasks.filter((task) => {
      if (
        selectedAssigneeId !== null &&
        Number(task.assigneeId) !== Number(selectedAssigneeId)
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const title = String(task.title || '').toLowerCase();
      const displayName = getDisplayNameById(task.assigneeId).toLowerCase();
      const taskAssigneeName = String(task.assigneeName || '').toLowerCase();

      return (
        title.includes(normalizedSearch) ||
        displayName.includes(normalizedSearch) ||
        taskAssigneeName.includes(normalizedSearch)
      );
    });

    rows = rows.slice().sort((a, b) => {
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;

      if (dueSortMode === 'due_desc') {
        return bDate - aDate;
      }

      return aDate - bDate;
    });

    return rows;
  }, [
    activeProjectTasks,
    dueSortMode,
    getDisplayNameById,
    searchQuery,
    selectedAssigneeId,
  ]);

  const activeTasks = activeProjectTasks.length;
  const doneTasks = taskProgressData.completed;

  useEffect(() => {
    return () => {
      if (toggleTimerRef.current !== null) {
        window.clearTimeout(toggleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isTasksExpanded) {
      return;
    }

    setSortMenuOpen(false);
    setAssigneeMenuOpen(false);
    setOpenedProgressKeys(new Set());
  }, [isTasksExpanded]);

  useEffect(() => {
    const next = new Set<string>(['overall-progress']);
    tasksByGroup.forEach((group) => {
      next.add(`group-${group.groupId}`);
    });
    setOpenedProgressKeys(next);
  }, [tasksByGroup]);

  const handleToggleTasks = () => {
    if (isTogglingTasks) {
      return;
    }

    setIsTogglingTasks(true);
    setIsArrowExpanded((prev) => !prev);

    toggleTimerRef.current = window.setTimeout(() => {
      setIsTasksExpanded((prev) => !prev);
      setIsTogglingTasks(false);
      toggleTimerRef.current = null;
    }, 180);
  };

  const toggleProgressUsers = (progressKey: string) => {
    setOpenedProgressKeys((prev) => {
      const next = new Set(prev);

      if (next.has(progressKey)) {
        next.delete(progressKey);
      } else {
        next.add(progressKey);
      }

      return next;
    });
  };

  const handleToggleSortMenu = () => {
    setSortMenuOpen((prev) => !prev);
    setAssigneeMenuOpen(false);
  };

  const handleToggleAssigneeMenu = () => {
    setAssigneeMenuOpen((prev) => !prev);
    setSortMenuOpen(false);
  };

  return (
    <section className="relative overflow-visible rounded-[16px] border border-[#8AE6FFCC] bg-[radial-gradient(120%_182%_at_74%_48%,rgba(62,116,138,0.78)_0%,rgba(21,36,58,0.96)_46%,rgba(4,6,10,1)_100%)] text-white shadow-[0_0_0_1px_rgba(138,230,255,0.24),0_0_24px_rgba(51,193,231,0.32)] ui-glow">
      <div className="px-6 pt-5 pb-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 truncate pr-2 text-[24px] max-[420px]:text-[22px] leading-[130%] tracking-[-0.5px] font-semibold text-[#F5FAFF] drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
            {projectTitle}
          </h3>
          <span className="shrink-0 text-[17px] leading-[130%] whitespace-nowrap text-[#E8F5FF]">
            Сдача:{' '}
            {project.DateFinish
              ? format(new Date(project.DateFinish), 'dd.MM.yyyy')
              : 'Не задано'}
          </span>
        </div>

        <div className="mb-4 flex items-center justify-between text-[15px] text-[#E8F5FFCC]">
          <span>Ведущий специалист</span>
          <div className="inline-flex items-center gap-1.5">
            {leadUser ? (
              <UserAvatar user={leadUser} size="sm" />
            ) : (
              <span className="h-5 w-5 rounded-full bg-[#8AE6FF33]" />
            )}
            <span>{leadName}</span>
          </div>
        </div>

        <ProgressRow
          label="Общий прогресс"
          progress={taskProgressData.progress}
          color="#319E00"
          count={taskProgressData.total}
          className="mb-3 h-[46px]"
          rounded="rounded-[12px]"
          textClass="text-[17px]"
          onClick={() => toggleProgressUsers('overall-progress')}
          isExpanded={openedProgressKeys.has('overall-progress')}
          glow
        />
        {openedProgressKeys.has('overall-progress') && (
          <ProgressUsersList users={overallProgressUsers} getUserById={getUserById} />
        )}

        <div
          className={`space-y-3 ${
            openedProgressKeys.has('overall-progress') ? 'mt-2' : ''
          }`}
        >
          {tasksByGroup.map((group) => {
            const progressKey = `group-${group.groupId}`;
            const isOpen = openedProgressKeys.has(progressKey);

            return (
              <div key={group.groupId} className="space-y-2">
                <ProgressRow
                  label={group.groupName}
                  progress={group.progress}
                  color={group.color}
                  count={group.totalTasks}
                  className="h-[34px]"
                  rounded="rounded-[8px]"
                  textClass="text-[15px]"
                  onClick={() => toggleProgressUsers(progressKey)}
                  isExpanded={isOpen}
                  glow
                />
                {isOpen && (
                  <ProgressUsersList
                    users={groupProgressUsersByGroup[group.groupId] ?? []}
                    getUserById={getUserById}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between text-[15px] leading-[130%] text-[#E8F5FF]">
          <StatItem
            icon={<Bolt className="h-4 w-4" />}
            label="Активные"
            value={activeTasks}
          />
          <StatItem
            icon={<Flag className="h-4 w-4" />}
            label="Завершенные"
            value={doneTasks}
          />
        </div>

        <div className="mt-3 h-px bg-[#FFFFFF3D]" />
      </div>

      <div className="flex justify-center py-2.5">
        <button
          type="button"
          onClick={handleToggleTasks}
          disabled={isTogglingTasks}
          aria-expanded={isTasksExpanded}
          aria-label={isTasksExpanded ? 'Свернуть список задач' : 'Развернуть список задач'}
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[#8AE6FF80] bg-[#12283B] text-[#DDF5FF] shadow-[0_0_10px_rgba(51,193,231,0.32)]"
        >
          <ChevronDown
            className={`h-[24px] w-[24px] transition-transform duration-200 ${
              isArrowExpanded ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>
      </div>

      {isTasksExpanded && (
        <div ref={filterMenuRef} className="px-4 pb-3 pt-3">
          <div className="relative mb-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Поиск: задача или фио"
                  className="h-[46px] w-full rounded-[12px] border border-[#8AE6FF33] bg-[#0E1C31] pl-11 pr-3 text-[15px] text-[#E8F5FF] placeholder:text-[#9FB6C7] outline-none"
                />
                <Search className="pointer-events-none absolute left-3 top-1/2 h-[20px] w-[20px] -translate-y-1/2 text-[#9FB6C7]" />
              </div>

              <button
                type="button"
                onClick={handleToggleSortMenu}
                className="flex h-[46px] w-[46px] items-center justify-center rounded-[12px] border border-[#8AE6FF66] bg-[#0E1C31] text-[#DDF5FF]"
                aria-label="Сортировка задач"
              >
                <SlidersHorizontal className="h-[20px] w-[20px]" />
              </button>

              <button
                type="button"
                onClick={handleToggleAssigneeMenu}
                className="flex h-[46px] w-[46px] items-center justify-center rounded-[12px] border border-[#8AE6FF66] bg-[#0E1C31] text-[#DDF5FF]"
                aria-label="Фильтр по исполнителю"
              >
                <Users className="h-[20px] w-[20px]" />
              </button>
            </div>

            {sortMenuOpen && (
              <div className="absolute right-[48px] top-[52px] z-30 min-w-[214px] rounded-[12px] border border-[#777] bg-[#0B0C10F2] px-2 py-2 text-white shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
                <button
                  type="button"
                  onClick={() => {
                    setDueSortMode('due_asc');
                    setSortMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-[7px] px-2 py-2 text-left text-[14px] hover:bg-white/10"
                >
                  <span>Сдача: по возрастанию</span>
                  <span>{dueSortMode === 'due_asc' ? '✓' : ''}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDueSortMode('due_desc');
                    setSortMenuOpen(false);
                  }}
                  className="mt-1 flex w-full items-center justify-between rounded-[7px] px-2 py-2 text-left text-[14px] hover:bg-white/10"
                >
                  <span>Сдача: по убыванию</span>
                  <span>{dueSortMode === 'due_desc' ? '✓' : ''}</span>
                </button>
              </div>
            )}

            {assigneeMenuOpen && (
              <div className="absolute right-0 top-[52px] z-30 min-w-[178px] rounded-[12px] border border-[#777] bg-[#0B0C10F2] px-2 py-2 text-white shadow-[0_8px_16px_rgba(0,0,0,0.4)]">
                {assigneeOptions.length === 0 ? (
                  <div className="px-2 py-1 text-[14px] text-[#C5D1DC]">
                    Нет исполнителей
                  </div>
                ) : (
                  assigneeOptions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedAssigneeId((prev) =>
                          prev === item.id ? null : item.id
                        );
                        setAssigneeMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-[7px] px-2 py-2 text-left text-[14px] hover:bg-white/10"
                    >
                      <span>{item.name}</span>
                      <span>{selectedAssigneeId === item.id ? '✓' : ''}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {filteredAndSortedTasks.length > 0 ? (
              filteredAndSortedTasks.map((task) => (
                <ProjectTaskItem key={task.id} task={task} />
              ))
            ) : (
              <div className="rounded-[12px] bg-white/90 px-4 py-3 text-center text-[15px] text-[#4E5A68]">
                Нет задач по выбранным фильтрам
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

function getReadableTextClass(hexColor: string): string {
  const match = hexColor.match(/^#([0-9a-f]{6})$/i);
  if (!match) {
    return 'text-white';
  }

  const value = match[1];
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  // Relative luminance approximation for choosing contrast text color.
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.6 ? 'text-[#101418]' : 'text-white';
}

function ProgressRow({
  label,
  progress,
  color,
  count,
  className,
  rounded,
  textClass,
  onClick,
  isExpanded = false,
  glow = false,
}: {
  label: string;
  progress: number;
  color: string;
  count?: number;
  className: string;
  rounded: string;
  textClass: string;
  onClick?: () => void;
  isExpanded?: boolean;
  glow?: boolean;
}) {
  const safeProgress = Number.isFinite(progress) ? Math.round(progress) : 0;
  const displayProgress = Math.max(0, safeProgress);
  const clampedProgress = Math.max(0, Math.min(100, displayProgress));
  const onFillTextClass = getReadableTextClass(color);
  const labelColorClass = clampedProgress <= 2 ? 'text-[#101418]' : onFillTextClass;
  const isPercentOnFill = clampedProgress >= 95;
  const percentTextClass =
    isPercentOnFill && onFillTextClass === 'text-white' ? 'text-white' : 'text-[#101418]';

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) {
          return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      aria-expanded={onClick ? isExpanded : undefined}
      className={`relative w-full overflow-hidden bg-[#E5E5E5] ${
        glow
          ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_0_12px_rgba(18,30,57,0.42)]'
          : ''
      } ${rounded} ${className} ${
        onClick ? 'cursor-pointer transition-opacity hover:opacity-95' : ''
      }`}
    >
      <div
        className="h-full transition-all duration-500"
        style={{
          width: `${clampedProgress}%`,
          backgroundColor: color,
        }}
      />

      <div className={`absolute inset-0 flex items-center justify-between px-3 ${textClass}`}>
        <div className={`min-w-0 flex-1 flex items-center gap-1.5 ${labelColorClass}`}>
          <span className="truncate">{label}</span>
          {typeof count === 'number' && count > 0 && (
            <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[5px] bg-[#151515] px-1.5 text-[12px] font-medium leading-none text-white">
              {count}
            </span>
          )}
        </div>

        <span
          className={`min-w-[72px] shrink-0 px-2.5 py-[2px] text-right text-[15px] tabular-nums font-semibold ${percentTextClass}`}
        >
          {displayProgress}%
        </span>
      </div>
    </div>
  );
}

function ProgressUsersList({
  users,
  getUserById,
}: {
  users: ProgressAssigneeRow[];
  getUserById: (id: number | null) => ANY;
}) {
  if (!users.length) {
    return (
      <div className="rounded-[8px] px-2 py-1.5 text-[14px] text-[#BFD2E2]">
        Нет пользователей
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-1">
      {users.map((user) => (
        <div key={user.key} className="px-1">
          <div className="flex items-center justify-between gap-2 py-0.5 text-[14px] text-[#E9F4FF]">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-[#9FB3C4]">...</span>
              {user.userId !== null && getUserById(user.userId) ? (
                <UserAvatar user={getUserById(user.userId)} size="md" />
              ) : (
                <span className="h-5 w-5 rounded-full bg-[#8AE6FF33]" />
              )}
              <span className="truncate">{user.name}</span>
            </div>
            <span className="shrink-0 tabular-nums">{user.percent}%</span>
          </div>
          <div className="mt-1.5 h-[2px] w-full overflow-hidden rounded-full bg-[#EAF2FB]">
            <div
              className="h-full bg-[#4EAF34]"
              style={{
                width: `${Math.max(0, Math.min(100, user.percent))}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {icon}
      <span>{label}</span>
      <span className="text-[18px] max-[420px]:text-[17px]">{value}</span>
    </div>
  );
}
