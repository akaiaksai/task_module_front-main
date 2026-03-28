import { useTimeman } from '@/hooks/timeman/useTimeman';
import { useTimemanTimer } from '@/hooks/timeman/useTimemanTimer';
import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { useAuthStore } from '@/store/auth';
import { formatTime } from '@/utils/time';
import { Clock, Folder, Pause, Play, Plus, Square, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useElapsedTimeActions } from '../../hooks/tasks/elapsed-times/useElapsedTimeActions';
import { useIntermediateTask } from '../../hooks/tasks/useIntermediateTask';
import { useTaskTitles } from '../../hooks/tasks/views/useTaskTitles';
import { useUserLocal } from '../../hooks/users/useUserLocal';
import { ActiveIntermediateTask } from '../../screens/tasks/_desktop/ActiveIntermediateTask';
import { useTaskTimerStore } from '../../store/task-timer';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import Textarea from '../../ui/Textarea';

interface TimemanDropdownProps {
  mobile?: boolean;
}

export const TimemanDropdown = ({ mobile = false }: TimemanDropdownProps) => {
  const { status, elapsedTime, isLoading, error, actions } = useTimeman();
  const userId = useAuthStore((s) => s.userId);
  const [searchParams] = useSearchParams();

  const {
    activeTaskId,
    tasks,
    startTask,
    pauseTask,
    stopTask,
    getCurrentElapsed,
  } = useTaskTimerStore();

  useTimemanTimer();

  const {
    createIntermediateTask,
    updateIntermediateTask,
    stopIntermediateTask,
    isLoading: isIntermediateLoading,
  } = useIntermediateTask({ type: 'intermediate' });

  const {
    createIntermediateTask: createMeetingTask,
    updateIntermediateTask: updateMeetingTask,
    stopIntermediateTask: stopMeetingTask,
    isLoading: isMeetingLoading,
    defaultDuration: meetingDuration,
  } = useIntermediateTask({ type: 'meeting' });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [report, setReport] = useState('');
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [isIntermediateModalOpen, setIsIntermediateModalOpen] = useState(false);
  const [intermediateComment, setIntermediateComment] = useState('');
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [currentTaskType, setCurrentTaskType] = useState<
    'intermediate' | 'meeting'
  >('intermediate');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const taskTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dropdownRef = useClickOutside(() => {
    setIsDropdownOpen(false);
    setShowCloseForm(false);
  });
  const { getTaskTitleById } = useTaskTitles();
  const getTaskTitle = useCallback(
    (task: ANY) => {
      return task ? getTaskTitleById(task.taskId) : 'Неизвестная задача';
    },
    [getTaskTitleById]
  );
  const { createElapsedTime } = useElapsedTimeActions();

  // Добавляем проверки на существование taskId
  const intermediateTask = tasks.find((task) =>
    task?.taskId?.startsWith('intermediate-')
  );
  const meetingTask = tasks.find((task) =>
    task?.taskId?.startsWith('meeting-')
  );

  const intermediateTaskId = intermediateTask?.taskId || null;
  const meetingTaskId = meetingTask?.taskId || null;

  const hasActiveTasks = tasks.some((task) => task?.isRunning);

  useEffect(() => {
    if (hasActiveTasks) {
      // taskTimerRef.current = setInterval(() => {}, 1000);
    } else {
      if (taskTimerRef.current) {
        clearInterval(taskTimerRef.current);
        taskTimerRef.current = null;
      }
    }

    return () => {
      if (taskTimerRef.current) {
        clearInterval(taskTimerRef.current);
      }
    };
  }, [hasActiveTasks]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      actions.clearError();
    }
  }, [error]);

  const handleToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleOpenWorkday = async () => {
    await actions.openWorkday();
    setIsDropdownOpen(false);
  };

  const handlePauseWorkday = async () => {
    await actions.pauseWorkday(15);
  };

  const handleResumeWorkday = async () => {
    await actions.resumeWorkday();
  };

  const handleCloseWorkday = async () => {
    if (!report.trim()) {
      toast.error('Пожалуйста, заполните отчет о работе');
      return;
    }

    try {
      if (intermediateTaskId) {
        await stopIntermediateTask(intermediateTaskId);
      }
      if (meetingTaskId) {
        await stopMeetingTask(meetingTaskId);
      }

      await actions.closeWorkday(report);
      toast.success('Рабочий день завершен');
      setReport('');
      setShowCloseForm(false);
      setIsDropdownOpen(false);
      setIntermediateComment('');
    } catch (error: ANY) {
      console.error('Ошибка при закрытии рабочего дня:', error);

      if (
        error?.code === 'NO_EXPIRED' ||
        error?.message?.includes('Workday is expired')
      ) {
        toast.error('Рабочий день уже истек или был завершен ранее', {
          description: 'Пожалуйста, начните новый рабочий день',
          duration: 5000,
        });

        setShowCloseForm(false);
        setIsDropdownOpen(false);
        setReport('');
      } else if (
        error?.message?.includes('network') ||
        error?.message?.includes('timeout')
      ) {
        toast.error('Ошибка сети', {
          description: 'Проверьте подключение к интернету и попробуйте снова',
        });
      } else {
        toast.error('Не удалось завершить рабочий день', {
          description: error?.message || 'Попробуйте еще раз',
        });
      }
    }
  };

  const handleShowCloseForm = () => {
    setShowCloseForm(true);
  };

  const handleCancelClose = () => {
    setShowCloseForm(false);
    setReport('');
  };

  const handleStartTaskById = (taskId: string) => {
    if (!taskId) {
      console.error('Task ID is undefined');
      return;
    }

    startTask(taskId);
  };

  const handleStopTaskById = async (taskId: string) => {
    if (!taskId || taskId.trim() === '') {
      toast.error('Нет задачи для остановки');
      return;
    }

    try {
      const elapsedSeconds = stopTask(taskId);

      if (elapsedSeconds > 0) {
        await createElapsedTime({
          taskId: Number(taskId),
          seconds: elapsedSeconds,
          comment: 'Работа над задачей',
        });
        toast.success(
          `Время работы сохранено: ${formatTime(elapsedSeconds * 1000)}`
        );
      }
    } catch (error) {
      console.error('Ошибка при сохранении времени задачи:', error);
      toast.error('Не удалось сохранить время задачи');
    }
  };

  const handleOpenTaskModal = (taskId: string) => {
    if (!taskId || taskId.trim() === '') {
      toast.error('Неверный ID задачи');
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.set('m', 'task');
    params.set('id', taskId);
    setIsDropdownOpen(false);
  };

  // Обработчики для промежуточных задач
  const handleStartIntermediateTask = (
    type: 'intermediate' | 'meeting' = 'intermediate'
  ) => {
    setCurrentTaskType(type);
    const existingTaskId =
      type === 'intermediate' ? intermediateTaskId : meetingTaskId;

    if (existingTaskId) {
      setIsEditingComment(true);
      setEditingTaskId(existingTaskId);
      setIsIntermediateModalOpen(true);
    } else {
      setIsEditingComment(false);
      setEditingTaskId(null);
      setIntermediateComment('');
      setIsIntermediateModalOpen(true);
    }
  };

  const handleStartIntermediateTimer = async () => {
    if (!intermediateComment.trim()) {
      toast.error('Пожалуйста, добавьте комментарий');
      return;
    }

    if (!userId) {
      toast.error('Не определен ID пользователя');
      return;
    }

    try {
      if (isEditingComment && editingTaskId) {
        // Обновляем существующую задачу
        const success =
          currentTaskType === 'intermediate'
            ? await updateIntermediateTask(editingTaskId, intermediateComment)
            : await updateMeetingTask(editingTaskId, intermediateComment);

        if (success) {
          toast.success('Комментарий задачи обновлен');
          setIsIntermediateModalOpen(false);
          setIsEditingComment(false);
          setEditingTaskId(null);
        }
      } else {
        // Создаем новую задачу
        const taskId =
          currentTaskType === 'intermediate'
            ? await createIntermediateTask(
                intermediateComment,
                undefined,
                userId
              )
            : await createMeetingTask(intermediateComment, undefined, userId);

        if (taskId) {
          setIsIntermediateModalOpen(false);
          toast.success(
            currentTaskType === 'intermediate'
              ? 'Промежуточная задача создана и запущена'
              : 'Встреча создана и запущена'
          );
        }
      }
    } catch (error: ANY) {
      toast.error(
        `Не удалось ${isEditingComment ? 'обновить' : 'создать'} задачу: ${
          error.message
        }`
      );
    }
  };

  const handleStopIntermediateTask = async (
    taskId: string,
    type: 'intermediate' | 'meeting'
  ) => {
    try {
      const success =
        type === 'intermediate'
          ? await stopIntermediateTask(taskId)
          : await stopMeetingTask(taskId);

      if (success) {
        setIntermediateComment('');
      }
    } catch (error) {
      console.error('Ошибка при сохранении времени задачи:', error);
      toast.error('Не удалось сохранить задачу');
    }
  };

  const handleEditIntermediateComment = (
    taskId: string,
    type: 'intermediate' | 'meeting'
  ) => {
    setCurrentTaskType(type);
    setIsEditingComment(true);
    setEditingTaskId(taskId);
    setIsIntermediateModalOpen(true);
  };

  const handleCloseIntermediateModal = () => {
    setIsIntermediateModalOpen(false);
    setIsEditingComment(false);
    setEditingTaskId(null);
  };
  const { getDisplayNameById } = useUserLocal.useUsersMap();

  const handleCompleteIntermediateTask = (taskId: string) => {
    console.log('Задача завершена и удалена из активных:', taskId);
  };

  // Фильтруем задачи (исключаем промежуточные и встречи) с проверками
  const filteredTasks = tasks.filter(
    (task) =>
      task?.taskId &&
      !task.taskId.startsWith('intermediate-') &&
      !task.taskId.startsWith('meeting-')
  );

  const filteredActiveTaskId =
    activeTaskId &&
    !activeTaskId.startsWith('intermediate-') &&
    !activeTaskId.startsWith('meeting-')
      ? activeTaskId
      : null;

  const activeTask = filteredActiveTaskId
    ? filteredTasks.find((t) => t.taskId === filteredActiveTaskId)
    : null;
  const isTaskRunning = activeTask?.isRunning || false;

  // Получаем название задачи из объекта задачи с защитой от undefined

  const currentDate = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const getStatusIcon = () => {
    switch (status) {
      case 'opened':
        return (
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        );
      case 'paused':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'opened':
        return 'Рабочий день активен';
      case 'paused':
        return 'Рабочий день на паузе';
      default:
        return 'Рабочий день не начат';
    }
  };

  const getTaskStatusIcon = () => {
    return isTaskRunning ? (
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
    ) : (
      <div className="w-2 h-2 bg-blue-300 rounded-full" />
    );
  };

  const getTaskStatusText = () => {
    return isTaskRunning ? 'В работе' : 'На паузе';
  };

  const taskElapsedTime = activeTaskId ? getCurrentElapsed(activeTaskId) : 0;

  // Стили для мобильной версии
  const mobileButtonClass = mobile
    ? 'btn-ghost p-2 rounded-lg hover:bg-gray-100 transition-colors min-w-0'
    : 'btn-ghost relative flex items-center gap-2';

  const dropdownWidthClass = mobile ? 'w-[95vw] max-w-[400px] mx-2' : 'w-96';

  const dropdownPositionClass = mobile
    ? 'fixed top-4 left-1/2 transform -translate-x-1/2 max-h-[calc(100vh-2rem)] overflow-y-auto'
    : 'absolute top-full right-0 mt-2';

  const getModalConfig = () => {
    return currentTaskType === 'intermediate'
      ? {
          title: isEditingComment
            ? 'Редактирование промежуточных дел'
            : 'Промежуточные дела',
          description: 'Опишите, что вы планируете сделать за 20 минут...',
          duration: 20,
          color: 'blue',
          buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
          bgClass: 'bg-blue-50 border-blue-200',
          textClass: 'text-blue-800',
        }
      : {
          title: isEditingComment ? 'Редактирование встречи' : 'Новая встреча',
          description: 'Опишите тему или участников встречи...',
          duration: meetingDuration,
          color: 'teal',
          buttonClass: 'bg-teal-600 hover:bg-teal-700 text-white',
          bgClass: 'bg-teal-50 border-teal-200',
          textClass: 'text-teal-800',
        };
  };

  const modalConfig = getModalConfig();

  return (
    <div className="relative z-10" ref={dropdownRef}>
      <button
        className={`${mobileButtonClass} ${
          status === 'opened' ? 'text-green-600 font-semibold' : ''
        }`}
        onClick={handleToggle}
        title="Рабочий день"
      >
        <Clock className="h-4 w-4" />
        {!mobile && <span>Рабочий день</span>}
        {status === 'opened' && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        )}
      </button>

      {isDropdownOpen && (
        <>
          {mobile && <div onClick={() => setIsDropdownOpen(false)} />}

          <div
            className={`${dropdownPositionClass} ${dropdownWidthClass} bg-white border border-gray-200 rounded-lg shadow-xl z-50`}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-semibold text-sm">
                  {getDisplayNameById(userId)}
                </span>
              </div>
              <div className="text-lg font-mono font-bold">
                {status !== 'closed' ? formatTime(elapsedTime) : '00:00:00'}
              </div>
            </div>

            <div className="p-4">
              {!showCloseForm && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {status === 'closed' && (
                    <Button
                      onClick={handleOpenWorkday}
                      disabled={isLoading}
                      className="btn btn-primary py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Загрузка...' : 'Начать день'}
                    </Button>
                  )}

                  {status === 'opened' && (
                    <>
                      <Button
                        onClick={handlePauseWorkday}
                        disabled={isLoading}
                        className="btn btn-secondary py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Пауза...' : 'Пауза'}
                      </Button>
                      <Button
                        onClick={handleShowCloseForm}
                        className="btn btn-warning py-2 text-sm font-medium"
                      >
                        Завершить
                      </Button>
                    </>
                  )}

                  {status === 'paused' && (
                    <>
                      <Button
                        onClick={handleResumeWorkday}
                        disabled={isLoading}
                        className="btn btn-primary py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Возобновление...' : 'Продолжить'}
                      </Button>
                      <Button
                        onClick={handleShowCloseForm}
                        className="btn btn-warning py-2 text-sm font-medium"
                      >
                        Завершить
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Кнопки для быстрого создания промежуточных задач и встреч */}
              {!showCloseForm &&
                (status === 'opened' || status === 'paused') &&
                !intermediateTaskId &&
                !meetingTaskId && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Button
                      onClick={() =>
                        handleStartIntermediateTask('intermediate')
                      }
                      className="btn bg-blue-600 hover:bg-blue-700 text-white py-2 text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Промежуточные
                    </Button>
                    <Button
                      onClick={() => handleStartIntermediateTask('meeting')}
                      className="btn bg-teal-600 hover:bg-teal-700 text-white py-2 text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Встреча
                    </Button>
                  </div>
                )}

              {/* Отображение активных промежуточных задач */}
              {intermediateTaskId && (
                <ActiveIntermediateTask
                  taskId={intermediateTaskId}
                  type="intermediate"
                  comment={intermediateComment}
                  onEdit={() =>
                    handleEditIntermediateComment(
                      intermediateTaskId,
                      'intermediate'
                    )
                  }
                  onStop={() =>
                    handleStopIntermediateTask(
                      intermediateTaskId,
                      'intermediate'
                    )
                  }
                  onComplete={handleCompleteIntermediateTask}
                />
              )}

              {/* Отображение активных встреч */}
              {meetingTaskId && (
                <ActiveIntermediateTask
                  taskId={meetingTaskId}
                  type="meeting"
                  comment={intermediateComment}
                  onEdit={() =>
                    handleEditIntermediateComment(meetingTaskId, 'meeting')
                  }
                  onStop={() =>
                    handleStopIntermediateTask(meetingTaskId, 'meeting')
                  }
                  onComplete={handleCompleteIntermediateTask}
                />
              )}

              {/* Форма закрытия рабочего дня */}
              {showCloseForm && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">
                    Завершение рабочего дня
                  </h4>
                  <textarea
                    value={report}
                    onChange={(e) => setReport(e.target.value)}
                    placeholder="Опишите, что вы сделали за сегодня..."
                    className="w-full h-20 p-3 border border-gray-300 rounded-lg text-sm resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCloseWorkday}
                      disabled={!report.trim() || isLoading}
                      className="btn btn-warning flex-1 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Завершение...' : 'Завершить день'}
                    </Button>
                    <Button
                      onClick={handleCancelClose}
                      className="flex-1 py-2 text-sm font-medium"
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              )}

              {/* Отображение активной основной задачи */}
              {filteredActiveTaskId && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Folder className="h-4 w-4 text-blue-600" />
                    <h4 className="text-sm font-medium text-gray-700">
                      Активная задача
                    </h4>
                  </div>

                  <div className="space-y-3">
                    <div
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleOpenTaskModal(filteredActiveTaskId)}
                    >
                      <div className="flex items-center gap-2">
                        {getTaskStatusIcon()}
                        <div>
                          <div className="text-sm font-medium text-blue-900 line-clamp-1">
                            {getTaskTitle(activeTask)}
                          </div>
                          <div className="text-xs text-blue-700 flex items-center gap-1">
                            {isTaskRunning ? (
                              <Play className="h-3 w-3" />
                            ) : (
                              <Pause className="h-3 w-3" />
                            )}
                            {getTaskStatusText()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold text-blue-900">
                          {formatTime(taskElapsedTime)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {isTaskRunning ? (
                        <Button
                          onClick={() => pauseTask(filteredActiveTaskId)}
                          className="btn btn-secondary flex-1 py-2 text-sm font-medium"
                          title="Приостановить задачу"
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Пауза
                        </Button>
                      ) : (
                        <Button
                          onClick={() =>
                            handleStartTaskById(filteredActiveTaskId)
                          }
                          className="btn btn-primary flex-1 py-2 text-sm font-medium"
                          title="Продолжить задачу"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Продолжить
                        </Button>
                      )}
                      <Button
                        onClick={() => handleStopTaskById(filteredActiveTaskId)}
                        className="btn btn-warning py-2 text-sm font-medium"
                        title="Завершить задачу и сохранить время"
                      >
                        <Square className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Список приостановленных задач */}
              {filteredTasks.filter(
                (task) => task.taskId !== filteredActiveTaskId
              ).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Folder className="h-4 w-4 text-gray-500" />
                    <h4 className="text-sm font-medium text-gray-700">
                      Приостановленные задачи (
                      {
                        filteredTasks.filter(
                          (task) => task.taskId !== filteredActiveTaskId
                        ).length
                      }
                      )
                    </h4>
                  </div>

                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filteredTasks
                      .filter((task) => task.taskId !== filteredActiveTaskId)
                      .map((task) => (
                        <div
                          key={task.taskId}
                          className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => handleOpenTaskModal(task.taskId)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full" />
                            <div>
                              <div className="text-xs font-medium text-gray-700 line-clamp-1">
                                {getTaskTitle(task)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatTime(getCurrentElapsed(task.taskId))}
                              </div>
                            </div>
                          </div>
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              onClick={() => handleStartTaskById(task.taskId)}
                              variant="ghost"
                              className="p-1 hover:bg-green-50 text-green-600 rounded-lg"
                              title="Возобновить задачу"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => handleStopTaskById(task.taskId)}
                              variant="ghost"
                              className="p-1 hover:bg-red-50 text-red-600 rounded-lg"
                              title="Завершить задачу"
                            >
                              <Square className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {!showCloseForm && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-600 text-center">
                    {getStatusText()}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Tasks System</span>
                <span>{currentDate}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Модальное окно для создания/редактирования промежуточных задач и встреч */}
      <Modal
        open={isIntermediateModalOpen}
        onClose={handleCloseIntermediateModal}
        title={modalConfig.title}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Комментарий
            </label>
            <Textarea
              value={intermediateComment}
              onChange={(e) => setIntermediateComment(e.target.value)}
              rows={3}
              placeholder={modalConfig.description}
              className="w-full"
            />
          </div>

          <div className={`${modalConfig.bgClass} p-3 rounded border`}>
            <p className={`text-sm ${modalConfig.textClass}`}>
              <strong>Максимальное время:</strong> {modalConfig.duration} минут
            </p>
            <p className={`text-xs ${modalConfig.textClass} opacity-75 mt-1`}>
              {isEditingComment
                ? `Вы можете изменить комментарий к текущим ${
                    currentTaskType === 'intermediate'
                      ? 'промежуточным делам'
                      : 'встрече'
                  }.`
                : `После ${modalConfig.duration} минут таймер продолжит отсчет с отметкой '+'. Все реальное время будет сохранено.`}
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" onClick={handleCloseIntermediateModal}>
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleStartIntermediateTimer}
              className={modalConfig.buttonClass}
              disabled={
                !intermediateComment.trim() ||
                isIntermediateLoading ||
                isMeetingLoading
              }
            >
              {isIntermediateLoading || isMeetingLoading
                ? 'Сохранение...'
                : isEditingComment
                  ? 'Обновить'
                  : 'Начать'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
