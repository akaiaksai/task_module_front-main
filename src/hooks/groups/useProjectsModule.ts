import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { http } from '../../lib/http';

function norm(v: ANY) {
  if (v == null) {
    return '';
  }
  if (typeof v === 'string') {
    return v;
  }
  if (typeof v === 'number') {
    return v;
  }
  if (typeof v === 'boolean') {
    return v;
  }
  if (typeof v === 'object' && 'String' in v) {
    return v.String;
  }
  return '';
}

function formatDate(date: ANY) {
  const str = norm(date);
  if (!str) {
    return '';
  }

  const d = new Date(str);
  if (isNaN(d.getTime())) {
    return '';
  }

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();

  return `${dd}.${mm}.${yyyy}`;
}

export interface ModuleTask {
  ID: number;
  TITLE: string;
  RESPONSIBLE_ID: number;
  TIME_ESTIMATE: number;
  DEADLINE: string;
  Skills: string[];
  Knowledge: string;
  GROUP_ID: number | null;
}

export interface ModuleProject {
  ID: number;
  Title: string;
  EntityTypeID: number;
  StageName: string;
  AssignedByID: string;

  Priority: string;
  DateStart: string;
  DateFinish: string;
  SettingsProp: ANY;

  TotalTimeEstimate: number;
  FreeTimeWeeks: number[];
}

export interface ModuleProjectWithTasks extends ModuleProject {
  groupId: number | null;
  tasks: ModuleTask[];
}

function normalizeProject(p: ANY): ModuleProject {
  return {
    ID: p.ID,
    Title: norm(p.Title),
    EntityTypeID: Number(p.EntityTypeID?.Int64 ?? p.EntityTypeID ?? 0),
    StageName: norm(p.StageName),
    AssignedByID: norm(p.AssignedByID),

    Priority: norm(p.Priority),
    DateStart: formatDate(p.DateStart),
    DateFinish: formatDate(p.DateFinish),
    SettingsProp: p.SettingsProp ?? null,

    TotalTimeEstimate: Number(p.TotalTimeEstimate ?? 0),

    FreeTimeWeeks: Array.isArray(p.FreeTimeWeeks)
      ? p.FreeTimeWeeks.map((el: ANY) =>
          typeof el === 'number' ? el : Number(el?.String ?? 0)
        )
      : [],
  };
}

function normalizeTask(t: ANY): ModuleTask {
  return {
    ID: Number(t.ID?.Int64 ?? t.ID),
    TITLE: norm(t.Title ?? t.TITLE),
    RESPONSIBLE_ID: Number(t.ResponsibleID?.Int64 ?? t.RESPONSIBLE_ID ?? 0),
    TIME_ESTIMATE: Number(t.TimeEstimate ?? t.TIME_ESTIMATE),
    DEADLINE: norm(t.Deadline ?? t.DEADLINE),
    Skills: Array.isArray(t.Skills) ? t.Skills : [],
    Knowledge: norm(t.Knowledge ?? ''),
    GROUP_ID: t.GroupID?.Valid ? Number(t.GroupID.Int64) : null,
  };
}

interface UseModuleProjectsWithTasksOptions {
  excludeCompleted?: boolean;
  search?: string;
  groupId?: number | null;
}

export function useModuleProjectsWithTasks(
  options: UseModuleProjectsWithTasksOptions = {}
) {
  const { excludeCompleted = false, search, groupId } = options;

  // 1. Грузим проекты через /projects/plan
  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery<ModuleProject[]>({
    queryKey: ['module-projects', search],
    queryFn: async () => {
      const res = await http.get<{ result: ANY[] }>('/projects/plan', {
        params: search ? { search } : undefined,
      });

      const raw = Array.isArray(res.data.result) ? res.data.result : [];
      return raw.map(normalizeProject);
    },
  });

  // 2. Для каждого проекта — задачи из /tasks/list
  const tasksQueries = useQueries({
    queries: (projectsData ?? []).map((project) => ({
      enabled: !!project.ID,
      queryKey: [
        'module-tasks',
        project.ID,
        project.EntityTypeID,
        excludeCompleted ? 'exclude_completed_true' : 'exclude_completed_false',
      ],
      queryFn: async () => {
        const params: ANY = {
          PROJECT_ENTITY_ID: project.ID,
          PROJECT_ENTITY_TYPE_ID: project.EntityTypeID,
        };

        if (excludeCompleted) {
          // бек ждёт ?exclude_completed=true
          params.exclude_completed = true;
        }

        const res = await http.get<{ result: ANY[] }>('/tasks/list', {
          params,
        });

        const raw = Array.isArray(res.data.result) ? res.data.result : [];
        return raw.map(normalizeTask);
      },
    })),
  });

  const isLoadingTasks =
    tasksQueries.length > 0 && tasksQueries.some((q) => q.isLoading);

  const tasksError = tasksQueries.find((q) => q.error)?.error ?? null;

  const projectsWithTasks = useMemo<ModuleProjectWithTasks[]>(() => {
    if (!projectsData) {
      return [];
    }

    return projectsData
      .map((project, index) => {
        const tasks = (tasksQueries[index]?.data as ModuleTask[]) || [];

        const groupId = tasks.find((t) => t.GROUP_ID != null)?.GROUP_ID ?? null;

        return {
          ...project,
          groupId,
          tasks,
        };
      })
      .filter((project) => {
        if (groupId == null) {
          return true;
        }
        return project.groupId === groupId;
      });
  }, [projectsData, tasksQueries, groupId]);

  return {
    projects: projectsWithTasks,
    isLoading: isLoadingProjects || isLoadingTasks,
    error: projectsError || tasksError,
  };
}
