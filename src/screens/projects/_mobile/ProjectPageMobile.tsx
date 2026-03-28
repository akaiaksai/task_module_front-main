// SmartContractsListMobile.tsx
import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { useUserLocal } from '@/hooks/users/useUserLocal';
import Skeleton from '@/ui/Skeleton';
import { Building, Check, Loader2, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ProjectWithTasks,
  useProjectsWithTasks,
} from '../../../hooks/groups/useProjectsWithTasks';
import { useTasks } from '../../../hooks/tasks/useTaskActions';
import { useAuthStore } from '../../../store/auth';
import { useTaskFiltersStore } from '../../../store/task-filters';
import TaskModal from '../../tasks/_desktop/_tasks-modals/TaskModal';
import { ProjectCardMobile } from './ProjectCardMobile';

type DueFilterMode = 'all' | 'soon' | 'late';

type ProjectMeta = {
  key: string;
  project: ProjectWithTasks;
  title: string;
  leadId: number | null;
  leadName: string;
  deadline: Date | null;
};

type LeadOption = {
  id: number;
  name: string;
};

function getSafeDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function getProjectTitle(project: ProjectWithTasks): string {
  const title = project.Title?.String?.trim();
  return title || `Проект ${project.ID}`;
}

function getProjectLeadId(project: ProjectWithTasks): number | null {
  const leadTask = project.tasks.find((task) => typeof task.assigneeId === 'number');
  return leadTask?.assigneeId ?? null;
}

function getProjectDeadline(project: ProjectWithTasks): Date | null {
  const directDeadline = getSafeDate(project.DateFinish);
  if (directDeadline) {
    return directDeadline;
  }

  const taskDates = project.tasks
    .map((task) => getSafeDate(task.dueDate))
    .filter((date): date is Date => Boolean(date));

  if (taskDates.length === 0) {
    return null;
  }

  return new Date(Math.max(...taskDates.map((date) => date.getTime())));
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function isModuleTasksProjectTitle(title: string): boolean {
  return normalize(title).includes('модуль задач');
}

export default function SmartContractsListMobile() {
  const { isAdmin, userId } = useAuthStore();
  const { getDisplayNameById } = useUserLocal.useUsersMap();

  const {
    onlyMyTasks,
    onlyAuditor,
    onlyAccomplice,
    onlyCreator,
    search: globalSearch,
    period: globalPeriod,
    resetFiltersForProjects,
  } = useTaskFiltersStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [leadPickerOpen, setLeadPickerOpen] = useState(false);
  const [projectPickerQuery, setProjectPickerQuery] = useState('');
  const [leadPickerQuery, setLeadPickerQuery] = useState('');
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(
    null
  );
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [dueFilterMode, setDueFilterMode] = useState<DueFilterMode>('all');
  const pickerSearchInputRef = useRef<HTMLInputElement>(null);

  const filterPanelRef = useClickOutside(() => {
    setProjectPickerOpen(false);
    setLeadPickerOpen(false);
  });

  useEffect(() => {
    resetFiltersForProjects();
  }, [resetFiltersForProjects]);

  useEffect(() => {
    if (!projectPickerOpen && !leadPickerOpen) {
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      pickerSearchInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [projectPickerOpen, leadPickerOpen]);

  // Параметры для фильтрации задач
  const taskQueryParams = useMemo(() => {
    const params: ANY = {
      page: 1,
      perPage: 10000,
      search: globalSearch || undefined,
      status: undefined,
      period: (globalPeriod as ANY) || undefined,
      onlyMyTasks,
      onlyAuditor,
      onlyAccomplice,
      onlyCreator,
      currentUserId: userId,
    };

    Object.keys(params).forEach((key) => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    return params;
  }, [
    onlyMyTasks,
    onlyAuditor,
    onlyAccomplice,
    onlyCreator,
    globalSearch,
    globalPeriod,
    userId,
  ]);

  // Получаем отфильтрованные задачи
  const { data: tasksData, isLoading: isLoadingTasks } = useTasks(
    taskQueryParams,
    {
      keepPreviousData: true,
      enabled: !isAdmin,
    }
  );

  const allTasks = tasksData?.items || [];
  const { projects: allProjects, isLoading: isLoadingProjects } =
    useProjectsWithTasks(
      isAdmin
        ? {
            mode: 'backend',
          }
        : {
            tasks: allTasks,
            mode: 'tasks-only',
          }
    );

  const baseProjectsMeta = useMemo(() => {
    const uniqueProjectsMap = new Map<string, ProjectWithTasks>();

    for (const project of allProjects) {
      const key = `${project.ID}-${project.EntityTypeID}`;
      if (!uniqueProjectsMap.has(key)) {
        uniqueProjectsMap.set(key, project);
      }
    }

    let uniqueProjects = Array.from(uniqueProjectsMap.values());

    if (!isAdmin) {
      uniqueProjects = uniqueProjects.filter((project) =>
        project.tasks.some((task) => task.assigneeId === Number(userId))
      );
    }

    const mapped = uniqueProjects.map((project) => {
      const leadId = getProjectLeadId(project);
      const leadNameFromMap = leadId !== null ? getDisplayNameById(leadId) : '';
      const leadNameFromTask =
        project.tasks.find((task) => task.assigneeName?.trim())?.assigneeName?.trim() ||
        '';

      return {
        key: `${project.ID}-${project.EntityTypeID}`,
        project,
        title: getProjectTitle(project),
        leadId,
        leadName: leadNameFromMap.trim() || leadNameFromTask || 'Без ведущего',
        deadline: getProjectDeadline(project),
      } satisfies ProjectMeta;
    });

    return mapped.sort((a, b) =>
      a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' })
    );
  }, [allProjects, isAdmin, userId, getDisplayNameById]);

  const projectOptions = useMemo(
    () => baseProjectsMeta.map((project) => ({ key: project.key, title: project.title })),
    [baseProjectsMeta]
  );

  const filteredProjectOptions = useMemo(() => {
    const query = normalize(projectPickerQuery);

    if (!query) {
      return projectOptions;
    }

    const startsWith: Array<{ key: string; title: string }> = [];
    const includes: Array<{ key: string; title: string }> = [];

    projectOptions.forEach((project) => {
      const title = project.title.toLowerCase();
      if (!title.includes(query)) {
        return;
      }

      if (title.startsWith(query)) {
        startsWith.push(project);
      } else {
        includes.push(project);
      }
    });

    return [...startsWith, ...includes];
  }, [projectOptions, projectPickerQuery]);

  const leadOptions = useMemo(() => {
    const leadsMap = new Map<number, string>();

    baseProjectsMeta.forEach((project) => {
      if (typeof project.leadId === 'number' && !leadsMap.has(project.leadId)) {
        leadsMap.set(project.leadId, project.leadName);
      }
    });

    return Array.from(leadsMap.entries())
      .map(([id, name]) => ({ id, name } satisfies LeadOption))
      .sort((a, b) => a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }));
  }, [baseProjectsMeta]);

  const filteredLeadOptions = useMemo(() => {
    const query = normalize(leadPickerQuery);

    if (!query) {
      return leadOptions;
    }

    return leadOptions.filter((lead) => lead.name.toLowerCase().includes(query));
  }, [leadOptions, leadPickerQuery]);

  const selectedProjectTitle = useMemo(() => {
    return projectOptions.find((project) => project.key === selectedProjectKey)?.title;
  }, [projectOptions, selectedProjectKey]);

  const selectedLeadName = useMemo(() => {
    return leadOptions.find((lead) => lead.id === selectedLeadId)?.name;
  }, [leadOptions, selectedLeadId]);

  const filteredProjectsMeta = useMemo(() => {
    const now = new Date();
    const soonLimit = new Date(now);
    soonLimit.setDate(now.getDate() + 7);
    const normalizedSearch = normalize(searchQuery);

    return baseProjectsMeta.filter((project) => {
      if (selectedProjectKey && project.key !== selectedProjectKey) {
        return false;
      }

      if (selectedLeadId !== null && project.leadId !== selectedLeadId) {
        return false;
      }

      const isModuleTasksProject = isModuleTasksProjectTitle(project.title);
      if (
        isModuleTasksProject &&
        !isAdmin &&
        !normalizedSearch &&
        !selectedProjectKey
      ) {
        return false;
      }

      if (dueFilterMode === 'soon') {
        if (!project.deadline) {
          return false;
        }

        const deadlineTime = project.deadline.getTime();
        if (deadlineTime < now.getTime() || deadlineTime > soonLimit.getTime()) {
          return false;
        }
      }

      if (dueFilterMode === 'late') {
        if (!project.deadline) {
          return false;
        }

        if (project.deadline.getTime() >= now.getTime()) {
          return false;
        }
      }

      if (!normalizedSearch) {
        return true;
      }

      if (project.title.toLowerCase().includes(normalizedSearch)) {
        return true;
      }

      if (project.leadName.toLowerCase().includes(normalizedSearch)) {
        return true;
      }

      return project.project.tasks.some((task) =>
        (task.title || '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [
    baseProjectsMeta,
    dueFilterMode,
    isAdmin,
    searchQuery,
    selectedLeadId,
    selectedProjectKey,
  ]);

  const isLoading = isAdmin ? isLoadingProjects : isLoadingTasks;

  const hasActiveFilters =
    selectedProjectKey !== null ||
    selectedLeadId !== null ||
    dueFilterMode !== 'all' ||
    searchQuery.trim().length > 0;

  const resetMobileFilters = useCallback(() => {
    setSelectedProjectKey(null);
    setSelectedLeadId(null);
    setDueFilterMode('all');
    setSearchQuery('');
    setProjectPickerQuery('');
    setLeadPickerQuery('');
    setProjectPickerOpen(false);
    setLeadPickerOpen(false);
  }, []);

  const toggleProjectPicker = () => {
    setProjectPickerOpen((prev) => {
      const next = !prev;
      if (next) {
        setLeadPickerOpen(false);
      }
      return next;
    });
  };

  const toggleLeadPicker = () => {
    setLeadPickerOpen((prev) => {
      const next = !prev;
      if (next) {
        setProjectPickerOpen(false);
      }
      return next;
    });
  };

  return (
    <div className="mt-[12px] px-[8px] pb-[104px] font-roboto">
      <section
        ref={filterPanelRef}
        className={`relative mb-3 overflow-visible rounded-[14px] border border-[#8AE6FF80] bg-mobile-header px-4 pb-4 pt-4 text-white ui-glow ${
          projectPickerOpen || leadPickerOpen ? 'z-[90]' : 'z-20'
        }`}
      >
        <div className="relative flex items-stretch gap-2">
          <button
            type="button"
            onClick={toggleProjectPicker}
            className={`h-[40px] min-w-0 flex-1 rounded-[10px] border px-2 text-[13px] transition ${
              selectedProjectKey !== null || projectPickerOpen
                ? 'border-[#8AE6FFCC] bg-[#1C3E55] text-white shadow-[0_0_12px_rgba(138,230,255,0.35)]'
                : 'border-[#8AE6FF33] bg-[#143147CC] text-[#E8F5FF]'
            }`}
          >
            <span className="block truncate">
              {selectedProjectTitle ? `Проект: ${selectedProjectTitle}` : 'Проект'}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleLeadPicker}
            className={`h-[40px] min-w-0 flex-1 rounded-[10px] border px-2 text-[13px] transition ${
              selectedLeadId !== null || leadPickerOpen
                ? 'border-[#8AE6FFCC] bg-[#1C3E55] text-white shadow-[0_0_12px_rgba(138,230,255,0.35)]'
                : 'border-[#8AE6FF33] bg-[#143147CC] text-[#E8F5FF]'
            }`}
          >
            <span className="block truncate">
              {selectedLeadName ? `Мои: ${selectedLeadName}` : 'Мои'}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setDueFilterMode((prev) => (prev === 'soon' ? 'all' : 'soon'))
            }
            className={`h-[40px] min-w-0 flex-1 rounded-[10px] border px-2 text-[13px] transition ${
              dueFilterMode === 'soon'
                ? 'border-[#8AE6FFCC] bg-[#1C3E55] text-white shadow-[0_0_12px_rgba(138,230,255,0.35)]'
                : 'border-[#8AE6FF33] bg-[#143147CC] text-[#E8F5FF]'
            }`}
          >
            Скоро
          </button>

          <button
            type="button"
            onClick={() =>
              setDueFilterMode((prev) => (prev === 'late' ? 'all' : 'late'))
            }
            className={`h-[40px] min-w-0 flex-1 rounded-[10px] border px-2 text-[13px] transition ${
              dueFilterMode === 'late'
                ? 'border-[#FF7F7FCC] bg-[#3A1B24] text-[#FF8080] shadow-[0_0_12px_rgba(255,128,128,0.25)]'
                : 'border-[#8AE6FF33] bg-[#143147CC] text-[#FF8080]'
            }`}
          >
            2Late
          </button>

          {(projectPickerOpen || leadPickerOpen) && (
            <div className="absolute left-0 right-0 top-full z-[120] mt-2 rounded-[12px] border border-[#8AE6FF99] bg-[#0E1F30] p-2 shadow-[0_12px_30px_rgba(0,0,0,0.55)]">
              <div className="relative">
                <input
                  ref={pickerSearchInputRef}
                  value={projectPickerOpen ? projectPickerQuery : leadPickerQuery}
                  onChange={(event) => {
                    if (projectPickerOpen) {
                      setProjectPickerQuery(event.target.value);
                    } else {
                      setLeadPickerQuery(event.target.value);
                    }
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={
                    projectPickerOpen ? 'Поиск проекта...' : 'Поиск ведущего...'
                  }
                  className="h-[38px] w-full rounded-[9px] border border-[#8AE6FF59] bg-[#112B40] px-3 pr-9 text-[13px] text-white placeholder:text-[#BFD6E5] outline-none"
                />
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#BFD6E5]" />
              </div>

              <div className="visible-scroll mt-2 max-h-[220px] space-y-1 overflow-y-auto pr-1">
                {projectPickerOpen &&
                  filteredProjectOptions.map((project) => (
                    <button
                      key={project.key}
                      type="button"
                      onClick={() => {
                        setSelectedProjectKey(project.key);
                        setProjectPickerOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-[8px] px-2.5 py-2 text-left text-[13px] text-white hover:bg-[#1F3D56]"
                    >
                      <span className="truncate">{project.title}</span>
                      {selectedProjectKey === project.key && (
                        <Check className="h-4 w-4 shrink-0 text-[#8AE6FF]" />
                      )}
                    </button>
                  ))}

                {leadPickerOpen &&
                  filteredLeadOptions.map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => {
                        setSelectedLeadId(lead.id);
                        setLeadPickerOpen(false);
                      }}
                      className="flex w-full items-center justify-between rounded-[8px] px-2.5 py-2 text-left text-[13px] text-white hover:bg-[#1F3D56]"
                    >
                      <span className="truncate">{lead.name}</span>
                      {selectedLeadId === lead.id && (
                        <Check className="h-4 w-4 shrink-0 text-[#8AE6FF]" />
                      )}
                    </button>
                  ))}

                {projectPickerOpen && filteredProjectOptions.length === 0 && (
                  <div className="px-2 py-2 text-[12px] text-[#BFD6E5]">
                    Проекты не найдены
                  </div>
                )}

                {leadPickerOpen && filteredLeadOptions.length === 0 && (
                  <div className="px-2 py-2 text-[12px] text-[#BFD6E5]">
                    Ведущие не найдены
                  </div>
                )}
              </div>

              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (projectPickerOpen) {
                      setSelectedProjectKey(null);
                    } else {
                      setSelectedLeadId(null);
                    }
                  }}
                  className="rounded-[8px] border border-[#8AE6FF66] px-3 py-1 text-[12px] text-[#D8ECFA] hover:bg-[#1E3D57]"
                >
                  Сбросить выбор
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Поиск"
              className="h-[42px] w-full rounded-[10px] border border-[#DCE5ED] bg-white px-4 pr-11 text-[15px] text-[#0C0F14] placeholder:text-[#798899] outline-none"
            />
            <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4D5E70]" />
          </div>

          <button
            type="button"
            onClick={resetMobileFilters}
            className={`flex h-[42px] w-[42px] items-center justify-center rounded-full border text-[15px] transition ${
              hasActiveFilters
                ? 'border-[#8AE6FFB2] bg-[#143147E6] text-white'
                : 'border-[#8AE6FF40] bg-[#14314780] text-[#D9EAF7]'
            }`}
            aria-label="Сбросить фильтры"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </section>

      <div className="relative z-0">
        {isLoading && <LoadingOverlay />}

        {isLoading && filteredProjectsMeta.length === 0 ? (
          <ContractsSkeletonMobile />
        ) : filteredProjectsMeta.length === 0 ? (
          <EmptyState
            isAdmin={isAdmin}
            hasSearch={hasActiveFilters}
            searchTerm={searchQuery}
          />
        ) : (
          <div className="space-y-3">
            {filteredProjectsMeta.map(({ project, key }) => {

              return (
                <div key={key} className="space-y-1">
                  <ProjectCardMobile
                    project={project}
                    isAdmin={isAdmin}
                    userId={userId}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <TaskModal />
    </div>
  );
}

const EmptyState = ({
  isAdmin,
  hasSearch = false,
  searchTerm = '',
}: {
  isAdmin: boolean;
  hasSearch?: boolean;
  searchTerm?: string;
}) => (
  <div className="py-8 text-center text-gray-500">
    <Building className="mx-auto mb-3 h-12 w-12 text-gray-400" />
    {hasSearch ? (
      <>
        <p className="text-base font-medium">Проекты не найдены</p>
        <p className="mt-1 text-sm">
          {searchTerm.trim()
            ? `По запросу “${searchTerm}” ничего не найдено`
            : 'По выбранным фильтрам ничего не найдено'}
        </p>
      </>
    ) : (
      <p className="text-base font-medium">
        {isAdmin ? 'Проекты не найдены' : 'Нет проектов с вашими задачами'}
      </p>
    )}
  </div>
);

const LoadingOverlay = () => (
  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white bg-opacity-70">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      <p className="text-sm text-gray-600">Загрузка данных...</p>
    </div>
  </div>
);

const ContractsSkeletonMobile = () => (
  <div className="space-y-3">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="flex flex-col rounded-xl border border-gray-200 bg-white p-4"
      >
        <div className="mb-4">
          <Skeleton className="mb-2 h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="mb-4">
          <div className="mb-2 flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
        </div>
        <div className="mb-3 border-t border-gray-200" />
        <div className="space-y-3">
          {[...Array(2)].map((__, j) => (
            <div key={j} className="space-y-2">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);
