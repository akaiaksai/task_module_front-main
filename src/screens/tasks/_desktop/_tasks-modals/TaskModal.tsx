import { BlockPill } from '@/components/dumb/BlockPill';
import { CommentsBlock } from '@/components/dumb/CommentsBlock';
import { CommunicationBlock } from '@/components/dumb/CommunicationBlock';
import { DescriptionBlock } from '@/components/dumb/DescriptionBlock';
import { PlanningBlock } from '@/components/dumb/PlanningBlock';
import { Calendar } from '@/components/icons/calendar';
import { Clock } from '@/components/icons/clock';
import { Flame } from '@/components/icons/flame';
import { XMarkIcon } from '@/components/icons/xMark';
import { CheckList } from '@/components/smart/CheckList';
import { TimeBlock } from '@/components/smart/DateTimeInput';
import { ProjectBlock } from '@/components/smart/ProjectBlock';
import { TeamBlock } from '@/components/smart/TeamBlock';
import { CompleteTaskModalWrapper } from '@/components/tasks/task-modals';
import { fetchUser, getTask } from '@/lib/api/tasks/tasks';
import { blocksConfig } from '@/shared/constants/blocksConfig';
import { BlockType } from '@/shared/types/blockType';
import {
  formatHMS,
  getNumberValue as getNumberValueHelper,
  getStringValue,
  safeFormatDate,
  sumElapsedMinutes,
} from '@/shared/utils/helpers';
import { useTaskTimerStore } from '@/store/task-timer';
import Button from '@/ui/Button';
import Modal from '@/ui/Modal';
import Skeleton from '@/ui/Skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Grid2x2Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useCommentActions } from '../../../../hooks/tasks/comments/useCommentActions';
import {
  useTask,
  useTaskActions,
} from '../../../../hooks/tasks/useTaskActions';
import { Comment } from '../../../../shared/types/comment';
import { Task } from '../../../../shared/types/task';
import { useRenewTask } from '../../_mobile/_calendar/hooks/useRenewTask';
import CommentFormModal from '../_modals/_comments-modals/CommentFormModal';
import DeleteTaskModal from './DeleteTaskModal';
import TaskFormModal from './TaskFormModal';

import { ClockOutline } from '@/components/icons/clockOutline';
import { useUsers, useUserUtils } from '@/hooks/users/useUserActions';
import { useAuthStore } from '@/store/auth';
import { useTaskSelectionModalStore } from '@/store/task-selection-modal';
import { UserAvatar } from '@/screens/groups/UserAvatar';

const getNumberValue = (value: ANY): number | null => {
  if (!value) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'object' && value.Valid) {
    const key = Object.keys(value).find((k) => k !== 'Valid');
    if (key && typeof value[key] === 'number') {
      return value[key];
    }
  }
  return null;
};

export default function TaskModal({
  onCompleteTask,
}: {
  onCreateSubtask?: (task: Task) => void;
  onCompleteTask?: (task: Task) => void;
}) {
  const [sp, setSp] = useSearchParams();
  const id = sp.get('id') || undefined;

  const [activeBlocks, setActiveBlocks] = useState<BlockType[]>([]);
  const [activeChecklistId, setActiveChecklistId] = useState<number | null>(
    null
  );

  const { userId } = useAuthStore();
  const { data: user } = useUsers.useById(userId);
  const displayName = useUserUtils.getDisplayName(user);

  const { renewTask, isLoading: isRenewLoading } = useRenewTask();

  interface Member {
    id: number;
    name: string;
    avatar: string | null;
  }

  const [teamMembers, setTeamMembers] = useState<Member[]>([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isCommentEditModalOpen, setIsCommentEditModalOpen] = useState(false);
  const [isCommentDeleteModalOpen, setIsCommentDeleteModalOpen] =
    useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

  const { activeTaskId, tasks, startTask, requestPause } = useTaskTimerStore();
  const openTaskSelectionModal = useTaskSelectionModalStore((s) => s.openModal);

  const currentTaskInStore = id
    ? tasks.find((task) => task.taskId === id)
    : null;
  const isActive = activeTaskId === id;
  const isRunning = currentTaskInStore?.isRunning || false;

  const {
    createComment,
    updateComment,
    deleteComment,
    isLoading: isCommentActionLoading,
  } = useCommentActions(id || '');
  const { updateTask, deleteTask } = useTaskActions();

  const close = () => {
    const next = new URLSearchParams(sp);
    next.delete('m');
    next.delete('id');
    setSp(next, { replace: true });
  };

  const { data: taskCore, refetch: refetchTaskCore } = useTask(id || '');

  const queryClient = useQueryClient();

  useEffect(() => {
    if (id) {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
    }
  }, [id, queryClient]);

  const { data: taskDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => getTask(id!),
    enabled: !!id,
  });

  const processedTask = useMemo<Task | undefined>(() => {
    if (!taskDetails) {
      return undefined;
    }

    return {
      ...taskDetails.core,
      files: taskDetails.core.files ?? [],
      accomplices: taskDetails.core.accomplices,
      auditors: taskDetails.core.auditors,
      createdBy: taskDetails.core.createdBy,
      checklist: taskDetails.checklist,
      comments: taskDetails.comments,
      elapsed: taskDetails.elapsed,
      title: getStringValue(taskDetails.core.title) || 'Без названия',
      description: getStringValue(taskDetails.core.description),
      assigneeName: getStringValue(taskDetails.core.assigneeName),
      assigneeId: getNumberValueHelper(taskDetails.core.assigneeId),
      dueDate: getStringValue(taskDetails.core.dueDate),
      createdAt: getStringValue(taskDetails.core.createdAt),
      timeEstimate: getNumberValueHelper(taskDetails.core.timeEstimate),
    };
  }, [taskDetails]);

  const mode = sp.get('m');
  const isOpen = mode === 'task' || mode === 'complete';

  useEffect(() => {
    if (mode === 'complete' && processedTask && id) {
      if (!isCompleteModalOpen) {
        handleFinishTask();
      }
    }
  }, [mode, processedTask, id]);

  const elapsedMin = sumElapsedMinutes(taskDetails?.elapsed);

  // команда для блока "Команда"
  async function loadTeamMembers(task: ANY): Promise<Member[]> {
    const ids = new Set(
      [
        task.assigneeId,
        ...(task.accomplices ?? []),
        ...(task.auditors ?? []),
        task.createdBy?.Int64 ?? null,
      ].filter(Boolean)
    );

    const users = await Promise.all(
      [...ids].map(async (id) => {
        const u = await fetchUser(Number(id));

        return {
          id: Number(id),
          name: `${u.LastName?.String ?? ''} ${u.Name?.String ?? ''}`.trim(),
          avatar: u.PersonalPhoto?.Int64 ?? null,
        };
      })
    );

    return users;
  }

  useEffect(() => {
    if (!processedTask) {
      return;
    }

    loadTeamMembers(processedTask).then(setTeamMembers);
  }, [processedTask]);

  function handleStartPause() {
    if (!id) {
      return;
    }

    if (!isActive) {
      startTask(id);
      return;
    }

    if (isRunning) {
      requestPause(id);
    } else {
      startTask(id);
    }
  }

  async function handleFinishTask() {
    if (!id || !processedTask) {
      return;
    }

    openTaskSelectionModal({
      mode: 'complete',
      taskId: id,
    });
  }

  const toggleBlock = (blockId: BlockType) => {
    setActiveBlocks((prev) =>
      prev.includes(blockId)
        ? prev.filter((id) => id !== blockId)
        : [blockId, ...prev]
    );
  };

  const renderBlockContent = (blockId: BlockType) => {
    if (!processedTask) {
      return null;
    }

    switch (blockId) {
      case 'planning':
        return (
          <PlanningBlock
            task={processedTask}
            onClose={() => toggleBlock('planning')}
          />
        );
      case 'project':
        return (
          <ProjectBlock
            task={processedTask}
            onClose={() => toggleBlock('project')}
          />
        );
      case 'team':
        return (
          <TeamBlock
            task={processedTask}
            onClose={() => toggleBlock('team')}
            teamMembers={teamMembers}
          />
        );
      case 'communication':
        return (
          <CommunicationBlock
            onClose={() => toggleBlock('communication')}
            lastMessage={processedTask.project?.lastMessage}
            resume={processedTask.project?.resume}
          />
        );
      case 'comments':
        return (
          <CommentsBlock
            task={processedTask}
            onClose={() => toggleBlock('comments')}
          />
        );
      case 'time':
        return <TimeBlock />;
      default:
        return null;
    }
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setSelectedTask(null);
    refetchTaskCore();
  };

  const handleCloseDelete = () => {
    setIsDeleteModalOpen(false);
    setSelectedTask(null);
    close();
  };

  const handleCloseComplete = () => {
    setIsCompleteModalOpen(false);
    setSelectedTask(null);
  };

  const handleCloseCommentModal = () => {
    setIsCommentModalOpen(false);
  };

  const handleCloseCommentEditModal = () => {
    setIsCommentEditModalOpen(false);
    setSelectedComment(null);
  };

  const handleCloseCommentDeleteModal = () => {
    setIsCommentDeleteModalOpen(false);
    setSelectedComment(null);
  };

  const handleUpdateTask = async (taskData: ANY) => {
    if (!id) {
      return;
    }

    try {
      await updateTask({
        id,
        payload: taskData,
      });
      toast.success('Задача обновлена');
      refetchTaskCore();
      handleCloseEdit();
    } catch (error) {
      toast.error('Не удалось обновить задачу');
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTask) {
      return;
    }

    try {
      await deleteTask(selectedTask.id);
      toast.success('Задача удалена');
      handleCloseDelete();
      close();
    } catch (error) {
      console.error(error);
      toast.error('Не удалось удалить задачу');
    }
  };

  const handleCompleteSuccess = () => {
    if (onCompleteTask && selectedTask) {
      onCompleteTask(selectedTask);
    }
    handleCloseComplete();
    refetchTaskCore();
    queryClient.invalidateQueries({ queryKey: ['task', id] });
  };

  const handleUpdateComment = async (commentData: { message: string }) => {
    if (!selectedComment) {
      return;
    }

    try {
      await updateComment({
        commentId: selectedComment.ID,
        commentData: { POST_MESSAGE: commentData.message },
      });
      toast.success('Комментарий обновлен');
      handleCloseCommentEditModal();
    } catch (error) {
      toast.error('Не удалось обновить комментарий');
      throw error;
    }
  };

  const handleCreateComment = async (commentData: { message: string }) => {
    if (!id) {
      return;
    }

    try {
      await createComment({ POST_MESSAGE: commentData.message });
      toast.success('Комментарий добавлен');
      handleCloseCommentModal();
    } catch (error) {
      toast.error('Не удалось добавить комментарий');
      throw error;
    }
  };

  const handleDeleteCommentConfirm = async () => {
    if (!selectedComment) {
      return;
    }

    try {
      await deleteComment(selectedComment.ID);
      toast.success('Комментарий удален');
      handleCloseCommentDeleteModal();
    } catch (error) {
      console.error(error);
      toast.error('Не удалось удалить комментарий');
    }
  };

  const getDescription = (desc: ANY): string | null => {
    if (!desc) {
      return null;
    }
    if (typeof desc === 'string') {
      return desc;
    }
    if (typeof desc === 'object' && desc.Valid) {
      return desc.String || null;
    }
    return null;
  };

  const titleFromProcessed =
    processedTask?.title || taskCore?.title || 'Без названия';

  const dueDateStr = processedTask?.dueDate
    ? safeFormatDate(processedTask.dueDate, 'dd.MM.yyyy')
    : null;

  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(titleFromProcessed);

  useEffect(() => {
    setDraftTitle(titleFromProcessed);
  }, [titleFromProcessed]);

  function enableTitleEdit() {
    setDraftTitle(titleFromProcessed);
    setEditingTitle(true);
  }

  function saveTitle() {
    setEditingTitle(false);
    if (draftTitle !== titleFromProcessed) {
      updateTask(
        {
          id: processedTask?.id as string,
          payload: { TITLE: draftTitle },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ['task', processedTask?.id],
            });
          },
        }
      );
    }
  }

  const isCompleted = processedTask?.status === 'done';

  return (
    <>
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[20] font-roboto">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={close}
            />

            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 py-[40px] px-[30px] max-h-[85vh] w-full flex flex-col rounded-[20px] shadow-xl max-w-4xl overflow-y-auto"
              style={{
                background:
                  'radial-gradient(100% 191.93% at 100% 50%, rgba(15, 17, 32, 0.2) 8.91%, rgba(11, 11, 11, 0.2) 24.77%, rgba(48, 198, 241, 0.2) 43.21%, rgba(59, 76, 188, 0.2) 85.86%, rgba(15, 17, 32, 0.2) 100%), linear-gradient(0deg, #0b0b0b, #0b0b0b)',
              }}
            >
              <div className="flex justify-between items-center">
                {!editingTitle ? (
                  <h1
                    className="text-[24px] font-normal leading-[130%] tracking-[-0.83px] line-clamp-2 break-keep cursor-pointer text-white"
                    onDoubleClick={enableTitleEdit}
                  >
                    {titleFromProcessed}
                  </h1>
                ) : (
                  <input
                    autoFocus
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onBlur={saveTitle}
                    className="w-full px-2 py-1 border rounded-lg text-[26px] font-normal tracking-[-0.83px]"
                  />
                )}
                <button className=" rounded-full p-2 group" onClick={close}>
                  <XMarkIcon color="white" />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-[25px] flex-wrap">
                <div className="flex items-center gap-2">
                  {user ? (
                    <UserAvatar user={user} size="sm" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-400 animate-pulse" />
                  )}
                  <span className="text-white text-[14px]">{displayName}</span>
                </div>
                <div className="flex items-center gap-2 bg-[#E320200F] px-4 py-3 rounded-full border border-[#E320201A]">
                  <Flame
                    className="translate-y-[-1px]"
                    width={16}
                    height={16}
                  />
                  <span className="text-[14px] leading-[130%] text-white">
                    Приоритет:{' '}
                    <span className="font-semibold">
                      {processedTask?.priority
                        ? `${processedTask?.priority}/10`
                        : '-'}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-[#2098E30F] px-4 py-3 rounded-full border border-[#2098E31A]">
                  <Calendar
                    className="translate-y-[-1px]"
                    width={16}
                    height={16}
                  />
                  <span className="text-[14px] leading-[130%] text-white">
                    Сдача:{' '}
                    <span className="font-semibold">
                      {dueDateStr ?? 'Не установлен'}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-[#5654E50A] px-4 py-3 rounded-full border border-[#5654E51A]">
                  <Clock
                    className="translate-y-[-1px]"
                    width={16}
                    height={16}
                  />
                  <span className="text-[14px] leading-[130%] text-white">
                    {formatHMS(elapsedMin * 60)} /{' '}
                    {taskDetails?.core.timeEstimate
                      ? formatHMS(taskDetails.core.timeEstimate)
                      : '-'}
                  </span>
                </div>
              </div>

              <div className="py-6">
                {(isDetailsLoading || !processedTask) && (
                  <div className="max-w-md mx-auto">
                    <Skeleton className="h-8 w-3/4 mb-6" />
                    <Skeleton className="h-32 w-full mb-3 rounded-2xl" />
                    <Skeleton className="h-32 w-full mb-3 rounded-2xl" />
                  </div>
                )}

                {!isDetailsLoading && !processedTask && (
                  <div className="text-sm text-neutral-500">
                    Не удалось загрузить задачу
                  </div>
                )}

                {!isDetailsLoading && processedTask && (
                  <>
                    <DescriptionBlock
                      task={processedTask}
                      isDesktop
                      onSave={(data) =>
                        updateTask(
                          { id: processedTask.id, payload: data },
                          {
                            onSuccess: () => {
                              queryClient.invalidateQueries({
                                queryKey: ['task', processedTask.id],
                              });
                            },
                          }
                        )
                      }
                    />

                    {processedTask.checklist &&
                      processedTask.checklist.length > 0 && (
                        <>
                          <div className="mt-[35px]">
                            <CheckList
                              title="Чек-листы"
                              tabs={processedTask.checklist.map((c: ANY) => ({
                                id: c.id,
                                label: c.title,
                              }))}
                              activeTab={activeChecklistId}
                              onTabChange={setActiveChecklistId}
                              items={
                                activeChecklistId
                                  ? (processedTask.checklist
                                      .find(
                                        (c: ANY) => c.id === activeChecklistId
                                      )
                                      ?.items.map((i: ANY) => ({
                                        id: i.id,
                                        text: i.title,
                                        checked: i.isComplete === 'Y',
                                      })) ?? [])
                                  : []
                              }
                              taskId={processedTask.id}
                              isDesktop
                            />
                          </div>
                        </>
                      )}

                    <div className="ml-auto flex items-center gap-5">
                      {!isCompleted && (
                        <button
                          onClick={handleStartPause}
                          className={`px-[10px] py-[6px] text-[14px] rounded-sm transition-all shadow-soft bg-white text-black`}
                        >
                          {!isActive
                            ? 'Начать учет времени'
                            : isRunning
                              ? 'На паузу'
                              : 'Продолжить'}
                        </button>
                      )}

                      {isCompleted ? (
                        <button
                          onClick={() => renewTask(processedTask.id)}
                          disabled={isRenewLoading}
                          className="px-[10px] py-[6px] rounded-sm text-[14px] border border-[#8AE6FF80] text-white shadow-soft"
                        >
                          {isRenewLoading ? 'Возобновление...' : 'Возобновить'}
                        </button>
                      ) : (
                        <button
                          onClick={handleFinishTask}
                          className="px-[10px] py-[6px] rounded-sm text-[14px] border border-[#8AE6FF80] text-white shadow-soft"
                        >
                          Завершить
                        </button>
                      )}
                      <div className="flex items-center gap-2 ">
                        <ClockOutline />
                        <span className="text-[14px] leading-[130%] text-white">
                          {formatHMS(elapsedMin * 60)} /{' '}
                          {taskDetails?.core.timeEstimate
                            ? formatHMS(taskDetails.core.timeEstimate)
                            : '-'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 my-[35px]">
                      {blocksConfig.map((block) => (
                        <BlockPill
                          key={block.id}
                          block={block}
                          isActive={activeBlocks.includes(block.id)}
                          onClick={() => toggleBlock(block.id)}
                        />
                      ))}
                    </div>

                    <div className="space-y-4 mb-10">
                      {activeBlocks.map((blockId) => (
                        <div key={blockId}>{renderBlockContent(blockId)}</div>
                      ))}
                    </div>

                    {activeBlocks.length === 0 && (
                      <div className="text-center pt-8 text-gray-500">
                        <Grid2x2Plus className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">
                          Выберите блоки для отображения информации
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {selectedTask && (
        <TaskFormModal
          open={isEditModalOpen}
          onClose={handleCloseEdit}
          onSubmit={handleUpdateTask}
          initialData={{
            TITLE: selectedTask.title,
            DESCRIPTION: getDescription(selectedTask.description) || '',
            RESPONSIBLE_ID: selectedTask.assigneeId || undefined,
            GROUP_ID: selectedTask.groupId || null,
            DEADLINE: selectedTask.dueDate
              ? format(parseISO(selectedTask.dueDate), "yyyy-MM-dd'T'HH:mm")
              : '',
            ACCOMPLICES: selectedTask.accomplices || [],
            AUDITORS: selectedTask.auditors || [],
            PARENT_ID: null,
            TIME_ESTIMATE: getNumberValue(selectedTask.timeEstimate) || null,
            TAGS: selectedTask.tagsCSV,
            UF_CRM_TASK: selectedTask.UfCrmTask,
            project: selectedTask.project,
          }}
          isLoading={false}
          mode="edit"
        />
      )}

      <DeleteTaskModal
        open={isDeleteModalOpen}
        onClose={handleCloseDelete}
        onConfirm={handleDeleteConfirm}
        taskTitle={selectedTask?.title || ''}
        isLoading={false}
      />

      {selectedTask && (
        <CompleteTaskModalWrapper
          taskId={selectedTask.id}
          open={isCompleteModalOpen}
          onClose={handleCloseComplete}
          onSuccess={handleCompleteSuccess}
        />
      )}

      {id && (
        <CommentFormModal
          taskId={id}
          open={isCommentModalOpen}
          onClose={handleCloseCommentModal}
          onSubmit={handleCreateComment}
          mode="create"
          isLoading={isCommentActionLoading}
        />
      )}

      {id && selectedComment && (
        <CommentFormModal
          taskId={id}
          open={isCommentEditModalOpen}
          onClose={handleCloseCommentEditModal}
          onSubmit={handleUpdateComment}
          mode="edit"
          comment={selectedComment}
          isLoading={isCommentActionLoading}
        />
      )}

      <div>
        <Modal
          open={isCommentDeleteModalOpen}
          onClose={handleCloseCommentDeleteModal}
          title="Удаление комментария"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Вы уверены, что хотите удалить этот комментарий? Это действие
              нельзя отменить.
            </p>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" onClick={handleCloseCommentDeleteModal}>
                Отмена
              </Button>
              <Button
                type="button"
                onClick={handleDeleteCommentConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={isCommentActionLoading}
              >
                {isCommentActionLoading ? 'Удаление...' : 'Удалить'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
