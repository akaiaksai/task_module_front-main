import Skeleton from '@/ui/Skeleton';
import { Table, TD, TH, THead, TR } from '@/ui/Table';
import { clsx } from 'clsx';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUserLocal } from '@/hooks/users/useUserLocal';
import { useAuthStore } from '@/store/auth';
import { useTaskTimerStore } from '@/store/task-timer';
import Pagination from '@/ui/Pagination';

import { Task } from '@/shared/types/task';
import { TableRow } from './TableRow';
import {
  CompleteTaskModalWrapper,
  CreateCommentModalWrapper,
} from './task-modals';
import { useTaskSelectionModalStore } from '@/store/task-selection-modal';

interface TasksTableProps {
  tasks: Task[];
  isLoading: boolean;
  perPage: number;
  isRefreshing?: boolean;
  page?: number;
  total?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onPageChange?: (page: number) => void;
  onSort: (field: string) => void;
  onTaskClick: (id: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onCreateSubtask?: (task: Task) => void;
  onCompleteTask?: (task: Task) => void;
}

export function TasksTable({
  tasks,
  isLoading,
  perPage,
  isRefreshing = false,
  onSort,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  onCreateSubtask,
  page = 1,
  total = 0,
  onPageChange,
  sortField,
  sortDirection,
  onCompleteTask,
}: TasksTableProps) {
  const { getDisplayNameById, isLoading: usersLoading } =
    useUserLocal.useUsersMap();
  const { isAdmin, userId } = useAuthStore();
  const { activeTaskId, startTask, requestPause } = useTaskTimerStore();

  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // const saveElapsed = async (taskId: string, comment: string) => {
  //   const elapsedMs = getCurrentElapsed(taskId);
  //   const seconds = Math.floor(elapsedMs / 1000);

  //   if (seconds <= 0) {
  //     return;
  //   }

  //   try {
  //     await createElapsedTime(Number(taskId), {
  //       seconds,
  //       comment,
  //     });
  //   } catch (e) {
  //     console.error(e);
  //     toast.error('Не удалось сохранить время');
  //   }
  // };
  useEffect(() => {
    if (!sortField && !isLoading) {
      onSort('title');
    }
  }, []);

  const handleAddComment = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsCommentModalOpen(true);
  };

  const handleCompleteTask = async (taskId: string) => {
    useTaskSelectionModalStore.getState().openModal({
      mode: 'complete',
      taskId,
    });
  };

  const handleCloseCommentModal = () => {
    setIsCommentModalOpen(false);
    setSelectedTaskId(null);
  };

  const handleCloseCompleteModal = () => {
    setIsCompleteModalOpen(false);
    setSelectedTaskId(null);
  };

  const handleCommentSuccess = () => {
    handleCloseCommentModal();
  };

  const handleCompleteSuccess = () => {
    if (onCompleteTask && selectedTaskId) {
      const completedTask = tasks.find((t) => t.id === selectedTaskId);
      if (completedTask) {
        onCompleteTask(completedTask);
      }
    }
    handleCloseCompleteModal();
  };

  const canEditTask = (task: Task): boolean => {
    if (isAdmin) {
      return true;
    }
    return task.assigneeId === userId;
  };

  const canDeleteTask = (task: Task): boolean => {
    if (isAdmin) {
      return true;
    }
    return task.assigneeId === userId;
  };

  const canCompleteTask = (task: Task): boolean => {
    if (isAdmin) {
      return true;
    }
    return task.assigneeId === userId;
  };

  const handleStartTask = (taskId: string) => startTask(taskId);

  const handlePauseTask = async (taskId: string) => {
    requestPause(taskId);
  };

  const isTaskActive = (taskId: string) => activeTaskId === taskId;

  const isTaskRunning = (taskId: string) => isTaskActive(taskId);

  const showLoading = isLoading || isRefreshing;

  return (
    <>
      <div className="overflow-hidden relative">
        {isRefreshing && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-lg border">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium text-gray-700">
                Обновление данных...
              </span>
            </div>
          </div>
        )}

        <div className="hidden lg:block relative">
          <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 w-full transition-all duration-300">
            <div className="min-w-max">
              <Table className="table-auto">
                <THead>
                  <TR className="text-[12px] font-normal leading-[130%]">
                    <TH
                      className={clsx(
                        'cursor-pointer',
                        sortField === 'title' && 'underline underline-offset-2',
                        showLoading && 'opacity-50'
                      )}
                      onClick={() => !showLoading && onSort('title')}
                    >
                      <div className="flex items-center gap-1">
                        Название
                        {sortField === 'title' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          ))}
                      </div>
                    </TH>

                    <TH
                      className={clsx(
                        'cursor-pointer px-[0.4rem] md:px-[0.6rem]',
                        sortField === 'status' &&
                          'underline underline-offset-2',
                        showLoading && 'opacity-50'
                      )}
                      onClick={() => !showLoading && onSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Статус
                        {sortField === 'status' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          ))}
                      </div>
                    </TH>

                    <TH
                      className={clsx(
                        'cursor-pointer px-[0.4rem] md:px-[0.6rem]',
                        sortField === 'priority' &&
                          'underline underline-offset-2',
                        showLoading && 'opacity-50'
                      )}
                      onClick={() => !showLoading && onSort('priority')}
                    >
                      <div className="flex items-center gap-1">
                        Приоритет
                        {sortField === 'priority' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          ))}
                      </div>
                    </TH>

                    <TH
                      className={clsx(
                        'cursor-pointer text-left',
                        sortField === 'assigneeName' &&
                          'underline underline-offset-2',
                        showLoading && 'opacity-50'
                      )}
                      onClick={() => !showLoading && onSort('assigneeName')}
                    >
                      <div className="flex items-center gap-1">
                        Исполнитель
                        {sortField === 'assigneeName' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          ))}
                      </div>
                    </TH>

                    <TH
                      className={clsx(
                        'cursor-pointer text-right',
                        sortField === 'dueDate' &&
                          'underline underline-offset-2',
                        showLoading && 'opacity-50'
                      )}
                      onClick={() => !showLoading && onSort('dueDate')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Срок
                        {sortField === 'dueDate' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          ))}
                      </div>
                    </TH>

                    <TH
                      className={clsx(
                        'cursor-pointer text-right',
                        sortField === 'updatedAt' &&
                          'underline underline-offset-2',
                        showLoading && 'opacity-50'
                      )}
                      onClick={() => !showLoading && onSort('updatedAt')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Обновлено
                        {sortField === 'updatedAt' &&
                          (sortDirection === 'asc' ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          ))}
                      </div>
                    </TH>

                    <TH className="w-44 min-w-[160px] text-right text-black">
                      Действия
                    </TH>
                  </TR>
                </THead>

                <tbody>
                  {isLoading &&
                    Array.from({ length: perPage }).map((_, i) => (
                      <TR key={i}>
                        <TD>
                          <Skeleton className="h-4 w-56" />
                        </TD>
                        <TD>
                          <Skeleton className="h-4 w-20" />
                        </TD>
                        <TD>
                          <Skeleton className="h-4 w-16" />
                        </TD>
                        <TD>
                          <Skeleton className="h-4 w-24" />
                        </TD>
                        <TD>
                          <Skeleton className="h-4 w-32" />
                        </TD>
                        <TD>
                          <Skeleton className="h-4 w-24" />
                        </TD>
                        <TD>
                          <Skeleton className="h-4 w-36" />
                        </TD>
                        <TD>
                          <div className="flex gap-1">
                            <Skeleton className="h-6 w-6" />
                            <Skeleton className="h-6 w-6" />
                            <Skeleton className="h-6 w-6" />
                            <Skeleton className="h-6 w-6" />
                          </div>
                        </TD>
                      </TR>
                    ))}

                  {!isLoading &&
                    tasks.map((task) => (
                      <TableRow
                        key={task.id}
                        task={task}
                        usersLoading={usersLoading}
                        getDisplayNameById={getDisplayNameById}
                        isRefreshing={isRefreshing}
                        onTaskClick={onTaskClick}
                        onEditTask={onEditTask}
                        onDeleteTask={onDeleteTask}
                        handleAddComment={handleAddComment}
                        handleStartTask={handleStartTask}
                        handlePauseTask={handlePauseTask}
                        handleCompleteTask={handleCompleteTask}
                        isTaskActive={isTaskActive}
                        isTaskRunning={isTaskRunning}
                        canEditTask={canEditTask}
                        canDeleteTask={canDeleteTask}
                        canCompleteTask={canCompleteTask}
                        onCreateSubtask={onCreateSubtask}
                      />
                    ))}

                  {!isLoading && tasks.length === 0 && (
                    <TR>
                      <TD colSpan={8}>
                        <div className="py-10 text-center text-neutral-500">
                          Ничего не найдено
                        </div>
                      </TD>
                    </TR>
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {onPageChange && total > 0 && (
        <div className="mt-4 flex-shrink-0 pb-4">
          <Pagination
            page={page}
            perPage={perPage}
            total={total}
            onPageChange={onPageChange}
            disabled={showLoading}
          />
        </div>
      )}

      {selectedTaskId && (
        <CreateCommentModalWrapper
          taskId={selectedTaskId}
          open={isCommentModalOpen}
          onClose={handleCloseCommentModal}
          onSuccess={handleCommentSuccess}
        />
      )}

      {selectedTaskId && (
        <CompleteTaskModalWrapper
          taskId={selectedTaskId}
          open={isCompleteModalOpen}
          onClose={handleCloseCompleteModal}
          onSuccess={handleCompleteSuccess}
        />
      )}
    </>
  );
}
