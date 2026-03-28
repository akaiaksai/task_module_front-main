// TasksPageDesktop.tsx
import { TasksTable } from '@/components/tasks';
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { SidebarTask } from '../../../components/dumb/sidebarTask';
import { TasksControlPanel } from '../../../components/dumb/taskControlPanel';
import { useUserGroups } from '../../../hooks/groups/useGroupFilter';
import { useTasksFilters } from '../../../hooks/tasks/forms/useTaskFilter';
import {
  taskKeys,
  useTaskActions,
  useTasks,
} from '../../../hooks/tasks/useTaskActions';
import { useAuthStore } from '../../../store/auth';
import { useTaskFiltersStore } from '../../../store/task-filters';

import { CreateTaskData, Task } from '@/shared/types/task';
import { getStringValue } from '../../../utils/dataNormalizers';
import CalendarView from './_calendar/CalendarView';
import KanbanByDue from './_KanbanByDue';
import DayTasksModal from './_tasks-modals/DayTasksModal';
import DeleteTaskModal from './_tasks-modals/DeleteTaskModal';
import TaskFormModal from './_tasks-modals/TaskFormModal';
import TaskModal from './_tasks-modals/TaskModal';
import { useQueryClient } from '@tanstack/react-query';
import { RotateCw } from 'lucide-react';
import { useIntermediateLockStore } from '@/store/task-intermediate';
import { useIntermediateTask } from '@/hooks/tasks/useIntermediateTask';
import { IntermediateResultModal } from './_tasks-modals/IntermediateResultModal';

export default function TasksPageDesktop() {
  const { filters, updateFilters } = useTasksFilters();
  const queryClient = useQueryClient();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { isAdmin, userId } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateSubtaskModalOpen, setIsCreateSubtaskModalOpen] =
    useState(false);
  const [parentTaskId, setParentTaskId] = useState<string | null>(null);
  const [localFilters] = useState({
    responsibleId: '',
    createdBy: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Состояние для фильтрации по группам
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const { groups = [], isLoading: groupsLoading } = useUserGroups();

  const {
    onlyMyTasks,
    onlyAuditor,
    setOnlyMyTasks,
    onlyAccomplice,
    onlyCreator,
    search: globalSearch,
    status: globalStatus,
    period: globalPeriod,
    assigneeIds,
  } = useTaskFiltersStore();

  const { activeTaskId, expiresAt, requiresComment, expire } =
    useIntermediateLockStore();
  const { stopIntermediateTask } = useIntermediateTask();

  useEffect(() => {
    if (!requiresComment || !activeTaskId) {
      return;
    }

    stopIntermediateTask(activeTaskId);
  }, [requiresComment, activeTaskId]);

  useEffect(() => {
    if (!expiresAt || requiresComment) {
      return;
    }

    const now = Date.now();

    if (now >= expiresAt) {
      expire();
      return;
    }

    const timeout = setTimeout(() => {
      expire();
    }, expiresAt - now);

    return () => clearTimeout(timeout);
  }, [expiresAt, requiresComment, expire]);

  useEffect(() => {
    if (filters.view !== 'kanban' && onlyMyTasks) {
      setOnlyMyTasks(false);
    }
  }, [filters.view]);

  const handleRefreshTasks = () => {
    queryClient.invalidateQueries({
      queryKey: taskKeys.all,
    });
  };

  // Функция для переключения фильтра группы
  const toggleGroupFilter = useCallback(
    (groupId: number) => {
      setSelectedGroupIds((prev) => {
        const newSelectedGroupIds = prev.includes(groupId)
          ? prev.filter((id) => id !== groupId)
          : [...prev, groupId];

        updateFilters({ page: '1' });
        return newSelectedGroupIds;
      });
    },
    [updateFilters]
  );

  const onSort = (field: string) => {
    const current = filters.sort || '';
    const desc = current === `-${field}`;
    const next = desc ? field : `-${field}`;
    updateFilters({ sort: next, page: '1' });
  };

  const handleCreateSubtask = (task: Task) => {
    setParentTaskId(task.id);
    setIsCreateSubtaskModalOpen(true);
  };

  const {
    createTask,
    updateTask,
    deleteTask,
    isLoading: isTaskLoading,
  } = useTaskActions();

  // Функция для вычисления dateFrom и dateTo в зависимости от режима календаря
  const getCalendarDateRange = useMemo(() => {
    const anchor = parseISO(filters.date);

    switch (filters.cal) {
      case 'month':
        return {
          dateFrom: format(startOfMonth(anchor), 'yyyy-MM-dd'),
          dateTo: format(endOfMonth(anchor), 'yyyy-MM-dd'),
        };
      case 'week':
        return {
          dateFrom: format(
            startOfWeek(anchor, { weekStartsOn: 1 }),
            'yyyy-MM-dd'
          ),
          dateTo: format(endOfWeek(anchor, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        };
      case 'day':
        return {
          dateFrom: format(startOfDay(anchor), 'yyyy-MM-dd'),
          dateTo: format(endOfDay(anchor), 'yyyy-MM-dd'),
        };
      default:
        return {};
    }
  }, [filters.view, filters.cal, filters.date]);

  const sortField = filters.sort?.replace('-', '') || '';
  const sortDirection = filters.sort?.startsWith('-') ? 'desc' : 'asc';

  // Добавляем фильтр групп в параметры запроса
  const baseParams = useMemo(
    () => ({
      search: globalSearch || undefined,
      status: globalStatus === ' ' ? undefined : globalStatus,
      sort: filters.sort || undefined,
      period: globalPeriod || undefined,

      assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,

      responsibleId:
        isAdmin && localFilters.responsibleId
          ? Number(localFilters.responsibleId)
          : undefined,
      createdBy:
        isAdmin && localFilters.createdBy
          ? Number(localFilters.createdBy)
          : undefined,
      onlyMyTasks,
      onlyAuditor,
      onlyAccomplice,
      onlyCreator,
      currentUserId: userId,
      groupIds: selectedGroupIds.length > 0 ? selectedGroupIds : undefined,
      ...(filters.view === 'calendar' || filters.view === 'list'
        ? getCalendarDateRange
        : {}),
    }),
    [
      globalSearch,
      globalStatus,
      filters.sort,
      globalPeriod,
      assigneeIds,
      isAdmin,
      localFilters.responsibleId,
      localFilters.createdBy,
      onlyMyTasks,
      onlyAuditor,
      onlyAccomplice,
      onlyCreator,
      userId,
      selectedGroupIds,
      filters.view,
      getCalendarDateRange,
    ]
  );

  const listQueryParams = {
    ...baseParams,
    page: Number(filters.page),
    perPage: Number(filters.perPage),
  };

  const kanbanCalendarQueryParams = {
    ...baseParams,
    page: 1,
    perPage: 10000,
  };

  const currentQueryParams =
    filters.view === 'list' ? listQueryParams : kanbanCalendarQueryParams;

  const {
    data: tasksData,
    isLoading: isLoadingTasks,
    error: tasksError,
    isFetching: isFetchingTasks,
  } = useTasks(
    { ...currentQueryParams },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    }
  );

  if (tasksError) {
    toast.error('Не удалось загрузить задачи');
  }

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setSelectedTask(task);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTask) {
      return;
    }

    try {
      await deleteTask(selectedTask.id);
      toast.success('Задача удалена');
      setIsDeleteModalOpen(false);
      setSelectedTask(null);
    } catch (error: unknown) {
      console.error(error);
      toast.error('Не удалось удалить задачу');
    }
  };

  const handleCreateTask = async (taskData: CreateTaskData) => {
    try {
      await createTask(taskData);
      toast.success('Задача создана');
      setIsCreateModalOpen(false);
      setIsCreateSubtaskModalOpen(false);
      setParentTaskId(null);
    } catch (error: unknown) {
      console.error(error);
      toast.error('Не удалось создать задачу');
    }
  };

  const handleUpdateTask = async (taskData: CreateTaskData) => {
    if (!selectedTask) {
      return;
    }

    try {
      await updateTask({
        id: selectedTask.id,
        payload: taskData,
      });
      toast.success('Задача обновлена');
      setIsEditModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error(error);
      toast.error('Не удалось обновить задачу');
    }
  };

  const formatForInput = (dateString: string): string => {
    if (!dateString) {
      return '';
    }
    try {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const page = Number(filters.page);
  const perPage = Number(filters.perPage);
  const showLoading = isLoadingTasks || isFetchingTasks;

  const displayTasks = tasksData?.items ?? [];
  const total = tasksData?.total ?? 0;

  return (
    <div className="flex bg-neutral-50 font-roboto w-full max-w-full">
      <div className="w-full mx-auto">
        <main className="flex-1 flex flex-col">
          {/* Панель управления */}

          <TasksControlPanel
            filters={{
              view: filters.view as 'list' | 'kanban' | 'calendar',
              cal: filters.cal as 'month' | 'week' | 'day',
              date: filters.date,
            }}
            updateFilters={updateFilters}
            isLoadingTasks={isLoadingTasks}
            isFetchingTasks={isFetchingTasks}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            onCreateTask={() => setIsCreateModalOpen(true)}
          />

          <div className="flex justify-end mt-3 mb-4">
            <button
              onClick={handleRefreshTasks}
              disabled={isFetchingTasks}
              className="
                flex items-center gap-2
                px-4 py-2
                rounded-lg
                border border-gray-300
                text-sm font-medium
                hover:bg-gray-100
                transition
              "
            >
              <RotateCw
                className={`w-4 h-4 ${isFetchingTasks ? 'animate-spin' : ''}`}
              />
              Обновить задачи
            </button>
          </div>

          <div className="flex mt-1 gap-[10px]">
            {/* Sidebar */}
            <SidebarTask
              groups={groups}
              isLoading={groupsLoading}
              selectedGroupIds={selectedGroupIds}
              toggleGroupFilter={toggleGroupFilter}
            />

            {/* Основной контент */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0  md:ml-[clamp(0.5rem,1vw,1.5rem)]">
              {filters.view === 'list' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <TasksTable
                    sortField={sortField}
                    sortDirection={sortDirection}
                    tasks={displayTasks}
                    isLoading={isLoadingTasks}
                    isRefreshing={isFetchingTasks}
                    perPage={perPage}
                    onSort={onSort}
                    onTaskClick={(id) => {
                      const next = new URLSearchParams(searchParams);
                      next.set('m', 'task');
                      next.set('id', id);
                      setSearchParams(next, { replace: true });
                    }}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    onCreateSubtask={handleCreateSubtask}
                    page={page}
                    total={total}
                    onPageChange={(p) => updateFilters({ page: String(p) })}
                  />
                </div>
              )}

              {filters.view === 'kanban' && (
                <div className="flex-1 max-h-[100vh]">
                  <KanbanByDue
                    tasks={displayTasks}
                    anchorDate={parseISO(filters.date)}
                    loading={showLoading}
                  />
                </div>
              )}

              {filters.view === 'calendar' && (
                <div className="flex-1">
                  <CalendarView
                    tasks={displayTasks}
                    anchorDate={parseISO(filters.date)}
                    mode={filters.cal}
                    loading={showLoading}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Модальные окна */}
          <DayTasksModal tasks={displayTasks} />
          <TaskModal onCreateSubtask={handleCreateSubtask} />

          <TaskFormModal
            open={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={handleCreateTask}
            isLoading={isTaskLoading}
            mode="create"
          />

          {selectedTask && (
            <TaskFormModal
              open={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedTask(null);
              }}
              onSubmit={handleUpdateTask}
              initialData={{
                TITLE: selectedTask.title,
                DESCRIPTION: getStringValue(selectedTask.description),
                RESPONSIBLE_ID: selectedTask.assigneeId!,
                GROUP_ID: selectedTask.groupId,
                DEADLINE: selectedTask.dueDate
                  ? formatForInput(selectedTask.dueDate)
                  : '',
                ACCOMPLICES: selectedTask.accomplices || [],
                AUDITORS: selectedTask.auditors || [],
                PARENT_ID: selectedTask.parentId,
                TIME_ESTIMATE: selectedTask.timeEstimate,
                TAGS: selectedTask.tagsCSV,
                UF_CRM_TASK: selectedTask.UfCrmTask,
                project: selectedTask.project,
              }}
              isLoading={isTaskLoading}
              mode="edit"
            />
          )}

          <DeleteTaskModal
            open={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedTask(null);
            }}
            onConfirm={handleConfirmDelete}
            taskTitle={selectedTask?.title || ''}
            isLoading={isTaskLoading}
          />

          <TaskFormModal
            open={isCreateSubtaskModalOpen}
            onClose={() => {
              setIsCreateSubtaskModalOpen(false);
              setParentTaskId(null);
            }}
            onSubmit={handleCreateTask}
            initialData={
              parentTaskId
                ? {
                    PARENT_ID: Number(parentTaskId),
                    TITLE: '',
                    DESCRIPTION: '',
                    RESPONSIBLE_ID: undefined,
                    GROUP_ID: null,
                    DEADLINE: '',
                    ACCOMPLICES: [],
                    AUDITORS: [],
                  }
                : undefined
            }
            isLoading={isTaskLoading}
            mode="create"
          />
        </main>
      </div>
      {requiresComment && <IntermediateResultModal />}
    </div>
  );
}
