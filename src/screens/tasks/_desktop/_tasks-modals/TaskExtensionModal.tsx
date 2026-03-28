import { AlertTriangle, Calendar, Clock } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useCommentActions } from '../../../../hooks/tasks/comments/useCommentActions';
import {
  useCompleteTask,
  useTask,
  useTaskActions,
} from '../../../../hooks/tasks/useTaskActions';
import { useTaskTitles } from '../../../../hooks/tasks/views/useTaskTitles';
import { addCommentAsResult } from '../../../../lib/api/tasks/results';
import { useAuthStore } from '../../../../store/auth';
import { useTaskExtensionModal } from '../../../../store/task-extension-modal';
import { useTaskTimerStore } from '../../../../store/task-timer';
import Button from '../../../../ui/Button';
import Modal from '../../../../ui/Modal';
import { CompleteTaskModalWrapper } from '@/components/tasks/task-modals';

export const TaskExtensionModal = () => {
  const { isOpen, closeModal, taskId, originalTask } = useTaskExtensionModal();
  const { stopTask } = useTaskTimerStore();
  const { createTask } = useTaskActions();
  const { completeTask } = useCompleteTask();

  const currentUserId = useAuthStore((state) => state.userId);

  const serverTaskId = taskId
    ? taskId.replace(/^(intermediate|meeting)-/, '')
    : '';

  const { data: serverTask, isLoading: isTaskLoading } = useTask(serverTaskId);

  const { createComment } = useCommentActions(serverTaskId);

  const [extensionReason, setExtensionReason] = useState('');
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [deadlineDate, setDeadlineDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'extension' | 'completion'>(
    'extension'
  );

  const { getTaskTitleById } = useTaskTitles();

  const fullTaskData = serverTask || originalTask;

  // Функция для получения названия задачи
  const getTaskTitle = useCallback((): string => {
    if (!taskId) {
      return 'Неизвестная задача';
    }

    // Для промежуточных задач и встреч используем специальные названия
    if (taskId.startsWith('intermediate-')) {
      return 'Промежуточные дела';
    }
    if (taskId.startsWith('meeting-')) {
      return 'Встреча';
    }

    // Для обычных задач используем хук
    return getTaskTitleById(taskId);
  }, [taskId, getTaskTitleById]);

  // Функция для получения полного названия задачи (для создания новой задачи)
  const getFullTaskTitle = useCallback((): string => {
    if (!fullTaskData) {
      return getTaskTitle();
    }

    return (
      fullTaskData.title ||
      fullTaskData.TITLE ||
      fullTaskData.name ||
      getTaskTitle()
    );
  }, [fullTaskData, getTaskTitle]);

  // Функция для получения описания задачи
  const getTaskDescription = useCallback((): string => {
    if (!fullTaskData) {
      return 'Описание недоступно';
    }

    return (
      fullTaskData.description ||
      fullTaskData.DESCRIPTION ||
      fullTaskData.desc ||
      'Описание недоступно'
    );
  }, [fullTaskData]);

  if (!taskId) {
    return null;
  }

  const getResponsibleId = () => {
    if (!fullTaskData) {
      return currentUserId;
    }

    return (
      fullTaskData.assigneeId ||
      fullTaskData.responsibleId ||
      fullTaskData.RESPONSIBLE_ID ||
      fullTaskData.responsible?.id || // если ответственный - объект
      currentUserId // fallback на текущего пользователя
    );
  };

  // Функция для извлечения числового ID из taskId
  const getServerTaskId = (id: string): string => {
    return id.replace(/^(intermediate|meeting)-/, '');
  };

  // Конвертируем время в секунды
  const getTimeInSeconds = (): number => {
    return hours * 3600 + minutes * 60;
  };

  // Конвертируем время в читаемый формат
  const getTimeDisplay = (): string => {
    if (hours > 0 && minutes > 0) {
      return `${hours} ч ${minutes} мин`;
    } else if (hours > 0) {
      return `${hours} ч`;
    } else if (minutes > 0) {
      return `${minutes} мин`;
    } else {
      return '0 мин';
    }
  };

  // Преобразуем datetime-local в ISO строку
  const getDeadlineISO = (): string => {
    return new Date(deadlineDate).toISOString();
  };

  // Форматирование даты для отображения
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExtend = async () => {
    if (!extensionReason.trim()) {
      toast.error('Пожалуйста, укажите причину продления');
      return;
    }

    if (!taskId) {
      toast.error('Ошибка: не указан идентификатор задачи');
      return;
    }

    // Проверяем, что указано время
    if (hours === 0 && minutes === 0) {
      toast.error('Укажите оценку времени');
      return;
    }

    // Проверяем, что дедлайн в будущем
    const deadline = new Date(deadlineDate);
    if (deadline <= new Date()) {
      toast.error('Дедлайн должен быть в будущем');
      return;
    }

    // Получаем ID ответственного
    const responsibleId = getResponsibleId();
    if (!responsibleId) {
      toast.error('Не удалось определить ответственного для задачи');
      return;
    }

    setIsLoading(true);
    try {
      const newDeadline = getDeadlineISO();
      const timeEstimateSeconds = getTimeInSeconds();

      const numericTaskId = getServerTaskId(taskId);
      console.log('ID задачи для завершения:', numericTaskId);
      console.log('Ответственный для новой задачи:', responsibleId);
      let commentId: number | undefined;

      try {
        const commentResponse = await createComment({
          POST_MESSAGE: `**Результат продления:** ${extensionReason}\n**Причина:** Требуется дополнительное время\n**Новая оценка времени:** ${getTimeDisplay()}\n**Новый дедлайн:** ${formatDate(
            newDeadline
          )}`,
        });
        commentId = commentResponse.commentId;
        console.log('Комментарий-результат добавлен');
      } catch (commentError) {
        console.error('Ошибка при создании комментария:', commentError);
      }

      if (commentId) {
        try {
          await addCommentAsResult(numericTaskId, commentId);
          console.log('Комментарий закреплен как результат');
        } catch (resultError) {
          console.error(
            'Ошибка при закреплении комментария как результата:',
            resultError
          );
        }
      }

      const newTaskData = {
        TITLE: `[Продление] ${getFullTaskTitle()}`,
        DESCRIPTION: `${getTaskDescription()}\n\n---\nПричина продления: ${extensionReason}\n`,
        RESPONSIBLE_ID: responsibleId,
        GROUP_ID: fullTaskData?.groupId || fullTaskData?.GROUP_ID || 0,
        DEADLINE: newDeadline,
        ACCOMPLICES:
          fullTaskData?.accomplices || fullTaskData?.ACCOMPLICES || [],
        AUDITORS: fullTaskData?.auditors || fullTaskData?.AUDITORS || [],
        STATUS: '1',
        PRIORITY: fullTaskData?.priority || fullTaskData?.PRIORITY || 'normal',
        TIME_ESTIMATE: timeEstimateSeconds,
        PARENT_ID: fullTaskData?.parentId || fullTaskData?.PARENT_ID || 0,
        TAGS: [
          ...(fullTaskData?.tags || fullTaskData?.TAGS || []),
          'GC System',
        ],
        ...(fullTaskData?.stageId && { STAGE_ID: fullTaskData.stageId }),
        ...(fullTaskData?.section_id && {
          SECTION_ID: fullTaskData.section_id,
        }),
      };

      console.log('Данные для создания новой задачи:', newTaskData);

      await createTask(newTaskData);
      console.log('Новая задача продления создана');

      await completeTask({ taskId: numericTaskId });
      console.log('Исходная задача завершена');

      // ОСТАНАВЛИВАЕМ задачу только после успешного создания продления
      stopTask(taskId, true); // true = isOverdue

      toast.success('Задача успешно продлена');
      closeModal();
      setExtensionReason('');
      setHours(0);
      setMinutes(30);
      // Сбрасываем дедлайн на завтра 18:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);
      setDeadlineDate(tomorrow.toISOString().slice(0, 16));
    } catch (error) {
      console.error('Ошибка при создании продления:', error);
      toast.error('Не удалось продлить задачу');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSuccess = () => {
    // ОСТАНАВЛИВАЕМ задачу только после успешного завершения
    stopTask(taskId, true); // true = isOverdue
    closeModal();
  };

  const handleCloseAttempt = () => {
    toast.error('Выберите действие: продление или завершение задачи');
  };

  const newDeadline = getDeadlineISO();

  return (
    <Modal
      open={isOpen}
      onClose={handleCloseAttempt}
      title="Время задачи истекло"
      maxWidth="max-w-lg"
      disableClose={true}
    >
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm font-medium">
              Время выполнения задачи превышено
            </p>
          </div>
          <p className="text-amber-700 text-sm mt-1">
            Выберите один из вариантов ниже для продолжения работы
          </p>
        </div>

        <p className="text-gray-600">
          Задача &ldquo;
          <span className="font-medium text-gray-900">{getTaskTitle()}</span>
          &rdquo; превысила заявленное время.
        </p>

        {/* Индикатор загрузки данных задачи */}
        {isTaskLoading && (
          <div className="text-sm text-gray-500">Загрузка данных задачи...</div>
        )}

        {/* Табы для выбора действия */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('extension')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'extension'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Продление
            </button>
            <button
              onClick={() => setActiveTab('completion')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'completion'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Завершение
            </button>
          </nav>
        </div>

        {/* Контент табов */}
        {activeTab === 'extension' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Причина продления *
              </label>
              <textarea
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="Опишите причину, по которой требуется продление..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            <div className="space-y-4">
              {/* Оценка времени */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Оценка времени *
                </label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Часы
                    </label>
                    <input
                      type="number"
                      value={hours}
                      onChange={(e) => setHours(Number(e.target.value))}
                      min="0"
                      max="1000"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      Минуты
                    </label>
                    <input
                      type="number"
                      value={minutes}
                      onChange={(e) => setMinutes(Number(e.target.value))}
                      min="0"
                      max="59"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="30"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Всего: {getTimeDisplay()} ({getTimeInSeconds()} секунд)
                </p>
              </div>

              {/* Дедлайн */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Дедлайн *
                </label>
                <input
                  type="datetime-local"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(newDeadline)}
                </p>
              </div>
            </div>

            <Button
              onClick={handleExtend}
              disabled={
                !extensionReason.trim() ||
                (hours === 0 && minutes === 0) ||
                isLoading ||
                isTaskLoading
              }
              className="w-full"
              variant="primary"
            >
              {isLoading ? 'Создание продления...' : 'Создать продление'}
            </Button>
          </div>
        )}

        {activeTab === 'completion' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Завершите текущую задачу стандартным способом.
            </p>

            <CompleteTaskModalWrapper
              taskId={getServerTaskId(taskId)} // Передаем числовой ID
              open={activeTab === 'completion'}
              onClose={() => setActiveTab('extension')}
              onSuccess={handleCompleteSuccess}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
