import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { http } from '../../lib/http';
import { Task } from '../../shared/types/task';

export interface Project {
  ID: number;
  EntityTypeID: number;
  Title: { String: string };
  StageID: { String: string };
  StageName: { String: string };
  AssignedByID: { String: string };
  CreatedBy: number;
  CreatedTime: string;

  lastMessage?: string;
  resume?: string;
}

export interface ProjectWithTasks extends Project {
  tasks: Task[];
  DateFinish?: string | null;
}

type Mode = 'auto' | 'tasks-only' | 'backend';

interface UseProjectsWithTasksOptions {
  tasks?: Task[];
  excludeCompleted?: boolean;
  mode?: Mode;
}

// Старая логика: собираем проекты из массива задач (когда Task уже содержит project)
function buildProjectsFromTasks(tasks: Task[]): ProjectWithTasks[] {
  const projectsMap = new Map<string, ProjectWithTasks>();

  const getDateFinish = (project: ANY): string | null => {
    if (!project) {
      return null;
    }

    const raw =
      project.DateFinish ?? project.DATE_FINISH ?? project.dateFinish ?? null;

    if (typeof raw === 'string' && raw.trim()) {
      return raw;
    }

    if (
      raw &&
      typeof raw === 'object' &&
      typeof raw.String === 'string' &&
      raw.String.trim()
    ) {
      return raw.String;
    }

    return null;
  };

  for (const task of tasks) {
    const anyTask = task as ANY;

    if (anyTask.project && anyTask.project.ID && anyTask.project.EntityTypeID) {
      const projectId = anyTask.project.ID;
      const entityTypeId = anyTask.project.EntityTypeID;
      const projectKey = `${projectId}-${entityTypeId}`;
      const dateFinish = getDateFinish(anyTask.project);

      if (!projectsMap.has(projectKey)) {
        projectsMap.set(projectKey, {
          ID: projectId,
          EntityTypeID: entityTypeId,
          Title: anyTask.project.Title,
          StageID: { String: anyTask.project.StageID?.String || '' },
          StageName: { String: anyTask.project.StageName?.String || '' },
          AssignedByID: { String: '' },
          CreatedBy: 0,
          CreatedTime: '',
          DateFinish: dateFinish,
          tasks: [],
        });
      }

      const project = projectsMap.get(projectKey)!;
      if (!project.DateFinish && dateFinish) {
        project.DateFinish = dateFinish;
      }
      project.tasks.push(task);
    }
  }

  return Array.from(projectsMap.values());
}

export function useProjectsWithTasks(
  options: UseProjectsWithTasksOptions = {}
) {
  const { tasks, excludeCompleted = false } = options;
  const mode: Mode = options.mode ?? 'auto';

  // true, если должны работать только по tasks (без бэка)
  const useTasksSource =
    mode === 'tasks-only' || (mode === 'auto' && tasks && tasks.length > 0);

  // 1) Режим "tasks-only"/"auto с tasks" – старая логика
  const projectsFromTasks = useMemo<ProjectWithTasks[] | null>(() => {
    if (!useTasksSource) {
      return null;
    }

    if (tasks && tasks.length > 0) {
      return buildProjectsFromTasks(tasks);
    }

    return [];
  }, [useTasksSource, tasks]);

  // 2) Режим "backend" или "auto без tasks" – тащим с бэка
  const {
    data: projectsData,
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ['projects-plan'],
    enabled: !useTasksSource, // этого достаточно, чтобы не дергать бек в tasks-only
    queryFn: async () => {
      const response = await http.get<{ result: Project[] }>('/projects/plan');
      return Array.isArray(response.data.result) ? response.data.result : [];
    },
  });

  const tasksQueries = useQueries({
    queries:
      !useTasksSource && projectsData && projectsData.length > 0
        ? projectsData.map((project) => ({
            queryKey: [
              'tasks',
              project.ID,
              project.EntityTypeID,
              excludeCompleted
                ? 'exclude_completed_true'
                : 'exclude_completed_false',
            ],
            queryFn: async () => {
              const params = new URLSearchParams();

              if (excludeCompleted) {
                params.set('exclude_completed', 'true');
              }

              params.set('PROJECT_ENTITY_ID', String(project.ID));
              params.set(
                'PROJECT_ENTITY_TYPE_ID',
                String(project.EntityTypeID)
              );

              const response = await http.get<{ result: Task[] }>(
                '/tasks/list',
                { params }
              );
              return Array.isArray(response.data.result)
                ? (response.data.result as Task[])
                : [];
            },
          }))
        : [],
  });

  const isTasksLoading =
    tasksQueries.length > 0 && tasksQueries.some((q) => q.isLoading);

  const tasksError = tasksQueries.find((q) => q.error)?.error ?? null;

  const projectsWithTasks = useMemo<ProjectWithTasks[]>(() => {
    if (useTasksSource) {
      return projectsFromTasks || [];
    }

    if (!projectsData || projectsData.length === 0) {
      return [];
    }

    return projectsData.map((project, index) => {
      const tasksForProject = tasksQueries[index]?.data || [];
      return {
        ...project,
        tasks: tasksForProject,
      };
    });
  }, [useTasksSource, projectsFromTasks, projectsData, tasksQueries]);

  return {
    projects: projectsWithTasks,
    isLoading: useTasksSource ? false : isProjectsLoading || isTasksLoading,
    error: (projectsError || tasksError) ?? null,
  };
}
