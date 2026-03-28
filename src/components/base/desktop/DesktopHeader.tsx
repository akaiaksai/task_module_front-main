import { Icon } from '@/components/icons/@icon';
import { ExitIcon } from '@/components/icons/exit';
import { SettingsIcon } from '@/components/icons/settingsIcon';
// import { CompleteTaskModalWrapper } from '@/components/tasks/task-modals';
// import { useElapsedTimeActions } from '@/hooks/tasks/elapsed-times/useElapsedTimeActions';
import { useTask } from '@/hooks/tasks/useTaskActions';
import { useRenewTask } from '@/screens/tasks/_mobile/_calendar/hooks/useRenewTask';
import { useAuthStore } from '@/store/auth';
import { useTaskTimerStore } from '@/store/task-timer';
import Button from '@/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { toast } from 'sonner';
import { MeetingModalNew } from '@/components/smart';
import { useIntermediateTask } from '@/hooks/tasks/useIntermediateTask';
import { UserAvatar } from '@/screens/groups/UserAvatar';
import { useTaskSelectionModalStore } from '@/store/task-selection-modal';
import gamechangerLogo from '../../../assets/logos/gamechanger-lg.svg';
import { useUsers, useUserUtils } from '../../../hooks/users/useUserActions';
import { DropdownGroupsBlack } from '../GroupsDropdown';
import { IntermediateTaskModal } from './IntermediateTaskModal';
import { WorkTimeCardDesktop } from './WorkTimeCardDesktop';
import { WorkTimeTaskCardDesktop } from './WorkTimeTaskCardDesktop';

export function DesktopHeader() {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showIntermediate, setShowIntermediate] = useState(false);
  const [openMeeting, setOpenMeeting] = useState(false);
  // const [completeModalOpen, setCompleteModalOpen] = useState(false);
  // const [completedTaskId, setCompletedTaskId] = useState<number | null>(null);

  const location = useLocation();

  const { userId, logout } = useAuthStore();
  const { data: user } = useUsers.useById(userId);
  // const { createElapsedTime } = useElapsedTimeActions();

  const displayName = useUserUtils.getDisplayName(user);
  const {
    activeTaskId,
    getTask,
    lastTaskId,
    getCurrentElapsed,
    requestPause,
    startTask,
  } = useTaskTimerStore();

  // const saveElapsed = async (taskId: string, comment: string) => {
  //   const elapsedMs = getCurrentElapsed(taskId);
  //   const seconds = Math.floor(elapsedMs / 1000);

  //   if (seconds <= 0) {
  //     return;
  //   }

  //   try {
  //     await createElapsedTime({
  //       taskId: Number(taskId.includes('-') ? taskId.split('-')[1] : taskId),
  //       seconds,
  //       comment,
  //     });
  //   } catch (e) {
  //     console.error(e);
  //     toast.error('Не удалось сохранить время');
  //   }
  // };

  const { renewTask, isLoading: isRenewing } = useRenewTask();

  const displayTaskId = activeTaskId ?? lastTaskId;

  const timerTask = useTaskTimerStore((state) =>
    displayTaskId
      ? state.tasks.find((t) => t.taskId === displayTaskId)
      : undefined
  );

  const isLocalTask = displayTaskId?.includes('-');

  const realId = displayTaskId?.includes('-')
    ? displayTaskId.split('-')[1]
    : displayTaskId;

  const { data: apiTask } = useTask(!isLocalTask ? (realId ?? '') : '');

  const isCompleted = apiTask?.status === 'done';

  const handleRenew = () => {
    if (!realId) {
      return;
    }
    renewTask(realId);
  };

  const toggleTask = async () => {
    if (!realId || isCompleted) {
      return;
    }

    const timer = displayTaskId ? getTask(displayTaskId) : undefined;

    if (!timer || !timer.isRunning) {
      startTask(realId);
      return;
    }

    if (!timer.title && apiTask) {
      useTaskTimerStore.getState().updateTaskMeta(realId, {
        title: apiTask.title,
        plannedMinutes: apiTask.timeEstimate
          ? Math.floor(apiTask.timeEstimate / 60)
          : 0,
      });
    }

    requestPause(realId);
  };

  const handleFinishTask = async () => {
    if (!displayTaskId) {
      return;
    }

    const real = displayTaskId.includes('-')
      ? displayTaskId.split('-')[1]
      : displayTaskId;

    useTaskSelectionModalStore.getState().openModal({
      mode: 'complete',
      taskId: real,
    });
  };

  const taskTitle = isLocalTask
    ? (timerTask?.title ?? 'Без названия')
    : (apiTask?.title ?? 'Без названия');

  const plannedMinutes = isLocalTask
    ? (timerTask?.plannedMinutes ?? 0)
    : apiTask?.timeEstimate
      ? Math.floor(apiTask.timeEstimate / 60)
      : 0;

  const spentMinutes = displayTaskId
    ? Math.floor(getCurrentElapsed(displayTaskId) / 60000)
    : 0;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleLogout = () => {
    logout();
  };

  const isRunning = !!displayTaskId && getTask(displayTaskId)?.isRunning;

  const { createIntermediateTask } = useIntermediateTask({
    type: 'intermediate',
  });

  const handleCreate = async () => {
    await createIntermediateTask('Промежуточная задача', 20, userId!);
  };

  const hasTask =
    Boolean(displayTaskId) &&
    (isLocalTask ? Boolean(timerTask) : Boolean(apiTask));

  return (
    <div className="mx-auto mt-2 mb-6 z-50 left-0 relative min-h-[73px] max-w-[1302px]">
      <header className="w-full ui-glow-desktop bg-mobile-header text-white rounded-[14px] overflow-visible relative font-roboto min-h-[73px]">
        <div className="flex items-center justify-between relative z-10 px-[20px] h-[73px]">
          {/* Логотип с уменьшением */}
          <div className={`flex items-center transition-all duration-300`}>
            <button
              onClick={() => handleNavigation('/')}
              className="flex items-center gap-[12px]"
            >
              <span
                className={`text-[40px] max-xl:text-[30px] font-normal leading-[130%] tracking-[-0.83px] transition-all duration-300`}
              >
                DOIT
              </span>
              {!isExpanded && (
                <div className="flex items-center gap-[2px] shrink-0">
                  <Icon />
                  <img
                    src={gamechangerLogo}
                    alt="logo"
                    className={'h-[20px] transition-all duration-300'}
                  />
                </div>
              )}
            </button>
          </div>

          {/* Навигация с сильным уменьшением */}
          <nav
            className={`flex items-center flex-1 transition-all duration-300 ml-[44px] max-xl:ml-[20px] ${
              isExpanded ? 'mr-[255px] max-xl:mr-[255px]' : 'mr-32'
            } max-xl:mr-[140px]`}
          >
            {/* Ссылки с уменьшенным текстом */}
            <div className="flex items-center text-[16px] font-normal leading-[130%] gap-8 max-xl:gap-5 max-xl:text-[14px] tracking-[-0.83px]">
              <Link
                to={'/'}
                className={`transition-all duration-300 ${
                  location.pathname === '/'
                    ? 'text-white text-glow-active'
                    : 'hover:text-gray-300'
                }`}
              >
                Общий
              </Link>
              <DropdownGroupsBlack />
              <Link
                to={'/projects'}
                className={`
                      transition-all duration-300
                      ${
                        location.pathname.startsWith('/projects')
                          ? 'text-white text-glow-active'
                          : 'hover:text-gray-300'
                      }
                    `}
              >
                Проект
              </Link>
            </div>

            <div className="flex items-center gap-[10px] max-xl:gap-[8px] ml-auto">
              <Button
                className={`text-center transition-all duration-300 max-xl:text-[12px] border border-[#8AE6FF80] ui-glow max-xl:px-[10px] max-xl:py-[6.5px] max-xl:rounded-[6px] ${'text-[12px] leading-[130%] font-normal tracking-[-0.83px] px-[14px] py-[8px] !bg-[#8AE6FF26] rounded-[8px] text-white'}`}
                onClick={handleCreate}
              >
                Промежутки
              </Button>

              <Button
                className={`text-center transition-all duration-300 max-xl:text-[12px] border border-[#8AE6FF80] ui-glow max-xl:px-[10px] max-xl:py-[6.5px] max-xl:rounded-[6px] ${'text-[12px] leading-[130%] font-normal tracking-[-0.83px] px-[14px] py-[8px] !bg-[#8AE6FF26] rounded-[8px] text-white'}`}
                onClick={() => setOpenMeeting(true)}
              >
                Встреча
              </Button>
              <Button
                className={`!bg-[#D52008] text-white text-center transition-all duration-300 max-xl:text-[12px] max-xl:px-[10px] max-xl:py-[6.5px] max-xl:rounded-[6px] ${'text-[12px] leading-[130%] font-normal tracking-[-0.83px] px-[12px] py-[8px] rounded-[8px]'}`}
              >
                Помощь
              </Button>
            </div>

            {/* Кнопки с уменьшением */}
            <div
              className={`flex items-center gap-2 sm:gap-3 md:gap-4 transition-all duration-300 ${
                isExpanded ? 'gap-1 sm:gap-2 md:gap-3 scale-90' : ''
              }`}
            ></div>
          </nav>

          {/* Блок пользователя (оставляем без изменений) */}
          <div
            className={`absolute right-0 top-0 bg-[#10293B] text-white rounded-[12px] overflow-hidden transition-all duration-300 flex flex-col ${isExpanded ? 'with-underlay ui-glow-desktop border-[1.5px] border-[#8AE6FF80]' : ''}`}
            style={{
              width: isExpanded ? 234 : 100,
              height: isExpanded ? 490 : 73,
            }}
          >
            <button
              onClick={toggleExpanded}
              className={`
                flex items-center h-[73px] transition-all duration-300 shrink-0
                ${isExpanded ? 'justify-between px-5' : 'justify-center'}
              `}
            >
              {isExpanded ? (
                <div className="flex items-center w-full">
                  <ChevronRight className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 mx-3 text-center overflow-hidden">
                    <div className="font-normal truncate whitespace-nowrap text-[13.89px] leading-[130%] tracking-[-0.39px]">
                      {displayName}
                    </div>
                  </div>
                  {user ? (
                    <UserAvatar user={user} size="xl" />
                  ) : (
                    <div className="w-[50px] h-[50px] rounded-full bg-gray-400 animate-pulse" />
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <ChevronLeft className="w-5 h-5" />
                  {user ? (
                    <UserAvatar user={user} size="xl" />
                  ) : (
                    <div className="w-[50px] h-[50px] rounded-full bg-gray-400 animate-pulse" />
                  )}
                </div>
              )}
            </button>

            <div
              className={`
                transition-all duration-300 overflow-y-auto
                ${isExpanded ? 'opacity-100 flex-1' : 'opacity-0 max-h-0 hidden'}
              `}
            >
              <div className="pb-[10px] px-[14px]">
                {hasTask && (
                  <WorkTimeTaskCardDesktop
                    title={taskTitle}
                    planned={plannedMinutes}
                    spent={spentMinutes}
                    isCompleted={isCompleted}
                    isRenewing={isRenewing}
                    onToggle={toggleTask}
                    onFinish={handleFinishTask}
                    onRenew={handleRenew}
                    isRunning={isRunning!}
                  />
                )}

                <WorkTimeCardDesktop userId={userId!} />
                <div className="mt-5">
                  <Link
                    to="/settings"
                    className={`flex items-center gap-3 w-full pl-[11.58px] py-[7.72px] rounded-lg transition-colors hover:bg-gray-600`}
                  >
                    <SettingsIcon />
                    <span className="font-normal text-[13.89px] leading-[130%] tracking-[-0.39px]">
                      Настройки
                    </span>
                  </Link>

                  <button
                    className="flex items-center gap-3 w-full pl-[11.58px] py-[7.72px] rounded-lg hover:bg-gray-600 transition-colors text-left"
                    onClick={handleLogout}
                  >
                    <ExitIcon />
                    <span className="font-normal text-[13.89px] leading-[130%] tracking-[-0.39px]">
                      Выйти
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <IntermediateTaskModal
        open={showIntermediate}
        onClose={() => setShowIntermediate(false)}
      />
      <MeetingModalNew
        open={openMeeting}
        onClose={() => setOpenMeeting(false)}
      />
      {/* {completedTaskId && (
        <CompleteTaskModalWrapper
          taskId={String(completedTaskId)}
          open={completeModalOpen}
          onClose={() => setCompleteModalOpen(false)}
          onSuccess={() => {
            setCompleteModalOpen(false);
          }}
        />
      )} */}
    </div>
  );
}
