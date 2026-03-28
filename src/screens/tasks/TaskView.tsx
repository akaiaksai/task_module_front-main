// screens/tasks/TaskView.tsx
import { BlockPill } from '@/components/dumb/BlockPill';
import { CommentsBlock } from '@/components/dumb/CommentsBlock';
import { CommunicationBlock } from '@/components/dumb/CommunicationBlock';
import { DescriptionBlock } from '@/components/dumb/DescriptionBlock';
import { PlanningBlock } from '@/components/dumb/PlanningBlock';
import { ClockOutline } from '@/components/icons/clockOutline';
import { CheckList } from '@/components/smart/CheckList';
import { TimeBlock } from '@/components/smart/DateTimeInput';
import { ProjectBlock } from '@/components/smart/ProjectBlock';
import { TeamBlock } from '@/components/smart/TeamBlock';
import { useTaskActions } from '@/hooks/tasks/useTaskActions';
import { useUsers, useUserUtils } from '@/hooks/users/useUserActions';
import { fetchUser, getTask } from '@/lib/api/tasks/tasks';
import { blocksConfig } from '@/shared/constants/blocksConfig';
import { BlockType } from '@/shared/types/blockType';
import { Task } from '@/shared/types/task';
import {
  formatHMS,
  getNumberValue,
  getStringValue,
  safeFormatDate,
  sumElapsedMinutes,
} from '@/shared/utils/helpers';
import { useAuthStore } from '@/store/auth';
import { useTaskSelectionModalStore } from '@/store/task-selection-modal';
import { useTaskTimerStore } from '@/store/task-timer';
import Skeleton from '@/ui/Skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Grid2x2Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserAvatar } from '../groups/UserAvatar';
import { useRenewTask } from './_mobile/_calendar/hooks/useRenewTask';

interface Member {
  id: number;
  name: string;
  avatar: string | null;
}

export default function TaskView() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeBlocks, setActiveBlocks] = useState<BlockType[]>([]);
  const [activeChecklistId, setActiveChecklistId] = useState<number | null>(
    null
  );
  const { renewTask, isLoading: isRenewLoading } = useRenewTask();
  const { userId } = useAuthStore();
  const { data: user } = useUsers.useById(userId);

  const displayName = useUserUtils.getDisplayName(user);

  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const { updateTask } = useTaskActions();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
    }
  }, [id, queryClient]);

  const {
    data: task,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['task', id],
    queryFn: () => getTask(id!),
    enabled: !!id,
  });

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

  // Функция для обработки данных задачи
  const processedTask = useMemo<Task | undefined>(() => {
    if (!task) {
      return undefined;
    }

    return {
      ...task.core,
      files: task.core.files ?? [],
      company: task.core.company,
      accomplices: task.core.accomplices,
      auditors: task.core.auditors,
      createdBy: task.core.createdBy,
      checklist: task.checklist,
      comments: task.comments,
      elapsed: task.elapsed,
      title: getStringValue(task.core.title) || 'Без названия',
      description: getStringValue(task.core.description),
      assigneeName: getStringValue(task.core.assigneeName),
      assigneeId: getNumberValue(task.core.assigneeId),
      dueDate: getStringValue(task.core.dueDate),
      createdAt: getStringValue(task.core.createdAt),
      timeEstimate: getNumberValue(task.core.timeEstimate),
    };
  }, [task]);

  useEffect(() => {
    if (!processedTask) {
      return;
    }

    loadTeamMembers(processedTask).then(setTeamMembers);
  }, [processedTask]);

  const { activeTaskId, tasks, startTask, requestPause } = useTaskTimerStore();

  const openTaskSelectionModal = useTaskSelectionModalStore((s) => s.openModal);

  const currentTaskInStore = id ? tasks.find((t) => t.taskId === id) : null;

  const isActive = activeTaskId === id;
  const isRunning = currentTaskInStore?.isRunning || false;
  const isCompleted = processedTask?.status === 'done';

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

  const dueDate = getStringValue(processedTask?.dueDate);
  const title = getStringValue(processedTask?.title) || 'Без названия';

  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  useEffect(() => {
    setDraftTitle(title);
  }, [title]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto">
          <Skeleton className="h-8 w-3/4 mb-6" />
          <Skeleton className="h-80 w-full mb-4 rounded-2xl" />
          <Skeleton className="h-32 w-full mb-3 rounded-2xl" />
          <Skeleton className="h-32 w-full mb-3 rounded-2xl" />
        </div>
      </div>
    );
  }
  if (isError || !processedTask) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="text-red-600 mb-4">Не удалось загрузить задачу</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return null;
  }

  function enableTitleEdit() {
    setDraftTitle(title);
    setEditingTitle(true);
  }

  async function saveTitle() {
    setEditingTitle(false);

    if (!draftTitle.trim() || draftTitle === title) {
      return;
    }

    await updateTask(
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

  const elapsedMin = sumElapsedMinutes(task.elapsed);
  // const timeInfo = getRemainingMinutes(task.core, elapsedMin);

  // const remainingSeconds = Math.max(totalPlanSeconds - elapsedSeconds, 0);

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

  return (
    <div className="px-4 relative -translate-y-2 pt-8">
      <div className="max-w-md mx-auto pb-[60px]">
        <div className="mb-7 font-roboto">
          <div className="flex justify-between mb-2 pr-1">
            {!editingTitle ? (
              <h1
                className="text-[22px] font-normal leading-[130%] mb-5 text-white cursor-pointer"
                onClick={enableTitleEdit}
              >
                {title}
              </h1>
            ) : (
              <input
                autoFocus
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onBlur={saveTitle}
                className="w-full text-[22px] font-normal leading-[130%] mb-5 px-2 py-1 border rounded-lg"
              />
            )}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors group"
              aria-label="Закрыть задачу"
            >
              <X className="w-5 h-5 text-white group-hover:text-black transition-colors" />
            </button>
          </div>

          {/* PILLS ROW */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {user ? (
                <UserAvatar user={user} size="sm" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-400 animate-pulse" />
              )}
              <span className="text-white text-[14px]">{displayName}</span>
            </div>
            <div className="flex items-center gap-2 bg-[#E320200F] px-4 py-2 rounded-full border border-[#E320201A]">
              <svg
                className="translate-y-[-1px]"
                width="10"
                height="13"
                viewBox="0 0 10 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.70022 0L3.78688 1.86667C3.13425 3.20023 2.25955 4.41308 1.20022 5.45333L1.08022 5.56667C0.399858 6.22718 0.0111245 7.13182 0.000216853 8.08V8.2C-0.0178031 10.0567 1.08862 11.7401 2.80022 12.46L2.97355 12.5333C4.09613 13.0102 5.36431 13.0102 6.48688 12.5333H6.52688C8.25128 11.7841 9.35767 10.0733 9.33355 8.19333V5.3C8.7589 6.61235 7.71529 7.66309 6.40688 8.24667C6.40688 8.24667 6.40688 8.24667 6.36688 8.24667C6.32688 8.24667 5.86022 8.44 5.66022 8.24667C5.48158 8.06592 5.46448 7.78081 5.62022 7.58L5.66688 7.54667H5.70022C7.23073 6.38332 7.58754 4.22782 6.51355 2.63333C5.64688 1.31333 4.70022 0 4.70022 0Z"
                  fill="#E32020"
                />
              </svg>

              <span className="text-[14px] font-normal leading-[130%] text-white">
                Приоритет:{' '}
                <span className="font-semibold">
                  {processedTask.priority
                    ? `${processedTask.priority}/10`
                    : '-'}
                </span>
              </span>
            </div>

            <div className="flex items-baseline gap-2 bg-[#2098E30F] px-4 py-2 rounded-full border border-[#2098E31A]">
              <svg
                className="translate-y-[2.5px] "
                width="14"
                height="15"
                viewBox="0 0 14 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9.93333 1.71333H10C11.8409 1.71333 13.3333 3.20572 13.3333 5.04667V11.0467C13.3333 12.8876 11.8409 14.38 10 14.38H3.33333C2.44928 14.38 1.60143 14.0288 0.976311 13.4037C0.351189 12.7786 0 11.9307 0 11.0467V5.04667C0 3.20572 1.49238 1.71333 3.33333 1.71333H3.4V0.5C3.4 0.223858 3.62386 0 3.9 0C4.17614 0 4.4 0.223858 4.4 0.5V1.71333H8.93333V0.5C8.93333 0.223858 9.15719 0 9.43333 0C9.70947 0 9.93333 0.223858 9.93333 0.5V1.71333ZM3.66667 5.77333H9.66667C9.94281 5.77333 10.1667 5.54948 10.1667 5.27333C10.1667 4.99719 9.94281 4.77333 9.66667 4.77333H3.66667C3.39052 4.77333 3.16667 4.99719 3.16667 5.27333C3.16667 5.54948 3.39052 5.77333 3.66667 5.77333Z"
                  fill="#2098E3"
                />
              </svg>

              <span className="text-[14px] font-normal text-white">
                Сдача:{' '}
                <span className="font-semibold">
                  {dueDate
                    ? safeFormatDate(dueDate, 'dd.MM.yyyy')
                    : 'Не установлен'}
                </span>
              </span>
            </div>

            <div className="flex items-baseline gap-2 bg-[#5654E50A] px-4 py-2 rounded-full border border-[#5654E51A]">
              <svg
                className="translate-y-[1px]"
                width="13"
                height="13"
                viewBox="0 0 13 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.5 0C2.91015 0 0 2.91015 0 6.5C0 10.0899 2.91015 13 6.5 13C10.0899 13 13 10.0899 13 6.5C13 2.91015 10.0899 0 6.5 0ZM7 2.5C7 2.22386 6.77614 2 6.5 2C6.22386 2 6 2.22386 6 2.5V6.5C6 6.77614 6.22386 7 6.5 7H9.5C9.77614 7 10 6.77614 10 6.5C10 6.22386 9.77614 6 9.5 6H7V2.5Z"
                  fill="#5654E5"
                />
              </svg>

              <span className="text-[14px] font-normal text-white">
                {formatHMS(elapsedMin * 60)} /{' '}
                {task.core.timeEstimate
                  ? formatHMS(task.core.timeEstimate)
                  : '-'}
              </span>
            </div>
          </div>
        </div>

        <DescriptionBlock
          task={processedTask}
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

        {processedTask.checklist && processedTask.checklist.length > 0 && (
          <>
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
                      .find((c: ANY) => c.id === activeChecklistId)
                      ?.items.map((i: ANY) => ({
                        id: i.id,
                        text: i.title,
                        checked: i.isComplete === 'Y',
                      })) ?? [])
                  : []
              }
              taskId={processedTask.id}
            />
          </>
        )}

        <div className="flex items-center gap-4 mb-[66px]">
          {!isCompleted && (
            <button
              onClick={handleStartPause}
              className={`px-2 py-[6px] text-[14px] rounded-md transition-all shadow-soft ${
                isRunning
                  ? 'bg-white text-black hover:bg-gray-100'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {!isActive ? 'Начать' : isRunning ? 'На паузу' : 'Продолжить'}
            </button>
          )}

          {isCompleted ? (
            <button
              onClick={() => renewTask(processedTask.id)}
              disabled={isRenewLoading}
              className="px-2 py-[6px] text-[14px] rounded-md bg-white hover:bg-gray-100 shadow-soft"
            >
              {isRenewLoading ? 'Возобновление...' : 'Возобновить'}
            </button>
          ) : (
            <button
              onClick={handleFinishTask}
              className="px-2 py-[6px] text-[14px] rounded-md bg-white hover:bg-gray-100 shadow-soft"
            >
              Завершить
            </button>
          )}

          <span className="text-[14px] text-white flex items-center gap-2">
            <ClockOutline />
            {formatHMS(elapsedMin * 60)} /{' '}
            {task.core.timeEstimate ? formatHMS(task.core.timeEstimate) : '-'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-7">
          <p className="w-full text-white text-[20px] mb-4 ">Другое</p>
          {blocksConfig.map((block) => (
            <BlockPill
              key={block.id}
              block={block}
              isActive={activeBlocks.includes(block.id)}
              onClick={() => toggleBlock(block.id)}
            />
          ))}
        </div>

        {/* Активные блоки */}
        <div className="space-y-3">
          {activeBlocks.map((blockId) => (
            <div key={blockId}>{renderBlockContent(blockId)}</div>
          ))}
        </div>

        {/* Сообщение если нет активных блоков */}
        {activeBlocks.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Grid2x2Plus className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Выберите блоки для отображения информации</p>
          </div>
        )}
      </div>
    </div>
  );
}
