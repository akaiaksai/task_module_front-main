import {
  Clock,
  AlertTriangle,
  Pencil,
  Square,
  Play,
  Pause,
  CheckCircle,
} from 'lucide-react';
import Button from '@/ui/Button';
import { useTaskTimerStore } from '@/store/task-timer';
import { formatTime } from '@/utils/time';
import { useCompleteTask } from '../../../hooks/tasks/useTaskActions';
import { toast } from 'sonner';

interface ActiveIntermediateTaskProps {
  taskId: string;
  type: 'intermediate' | 'meeting';
  comment?: string;
  onEdit: (taskId: string) => void;
  onStop: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
}

export const ActiveIntermediateTask = ({
  taskId,
  type,
  comment,
  onEdit,
  onStop,
  onComplete,
}: ActiveIntermediateTaskProps) => {
  const { getCurrentElapsed, pauseTask, startTask, getTask, stopTask } =
    useTaskTimerStore();

  const { completeTask, isLoading: isCompleting } = useCompleteTask();

  const task = getTask(taskId);
  const isRunning = task?.isRunning || false;
  const currentElapsed = getCurrentElapsed(taskId);

  const config = {
    intermediate: {
      title: 'Промежуточные дела',
      color: 'blue', // Изменено
      defaultDuration: 20 * 60 * 1000,
    },
    meeting: {
      title: 'Встреча',
      color: 'teal', // Изменено
      defaultDuration: 10 * 60 * 1000,
    },
  }[type];

  const timeLeft = Math.max(0, config.defaultDuration - currentElapsed);
  const exceededTime = Math.max(0, currentElapsed - config.defaultDuration);
  const isTimeExceeded = currentElapsed > config.defaultDuration;

  const getColorClasses = () => {
    const colors = {
      intermediate: {
        bg: isTimeExceeded ? 'bg-orange-50' : 'bg-purple-50',
        border: isTimeExceeded ? 'border-orange-200' : 'border-purple-200',
        text: isTimeExceeded ? 'text-orange-900' : 'text-purple-900',
        icon: isTimeExceeded ? 'text-orange-600' : 'text-purple-600',
        button: isTimeExceeded
          ? 'bg-orange-600 hover:bg-orange-700'
          : 'bg-purple-600 hover:bg-purple-700',
      },
      meeting: {
        bg: isTimeExceeded ? 'bg-orange-50' : 'bg-green-50',
        border: isTimeExceeded ? 'border-orange-200' : 'border-green-200',
        text: isTimeExceeded ? 'text-orange-900' : 'text-green-900',
        icon: isTimeExceeded ? 'text-orange-600' : 'text-green-600',
        button: isTimeExceeded
          ? 'bg-orange-600 hover:bg-orange-700'
          : 'bg-green-600 hover:bg-green-700',
      },
    };
    return colors[type];
  };

  const colorClasses = getColorClasses();

  const handlePause = () => {
    pauseTask(taskId);
  };

  const handleResume = () => {
    startTask(taskId);
  };

  const handleComplete = async () => {
    if (!taskId) {
      return;
    }

    try {
      if (isRunning) {
        pauseTask(taskId);
      }

      const serverTaskId = taskId.replace(`${type}-`, '');

      await completeTask({ taskId: serverTaskId });

      stopTask(taskId);

      if (onComplete) {
        onComplete(taskId);
      }

      toast.success('Задача успешно завершена');
    } catch (error) {
      console.error('Ошибка при завершении задачи:', error);
      toast.error('Не удалось завершить задачу');
    }
  };

  const formatExceededTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `+${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`mb-4 p-3 rounded-lg border ${colorClasses.bg} ${colorClasses.border}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className={`h-4 w-4 ${colorClasses.icon}`} />
          <span className={`text-sm font-medium ${colorClasses.text}`}>
            {config.title}
            {isTimeExceeded && (
              <span className="ml-1 inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                Время вышло
              </span>
            )}
          </span>
        </div>
        <div className="text-right">
          <div className={`text-lg font-mono font-bold ${colorClasses.text}`}>
            {isTimeExceeded
              ? formatExceededTime(exceededTime)
              : formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {comment && (
        <div className="mb-3">
          <p
            className={`text-xs p-2 rounded ${
              isTimeExceeded
                ? 'text-orange-700 bg-orange-100'
                : type === 'intermediate'
                  ? 'text-purple-700 bg-purple-100'
                  : 'text-green-700 bg-green-100'
            }`}
          >
            {comment}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {isRunning ? (
          <Button
            onClick={handlePause}
            className={`btn flex-1 py-1 text-xs ${colorClasses.button} text-white`}
          >
            <Pause className="h-3 w-3 mr-1" />
            Пауза
          </Button>
        ) : (
          <Button
            onClick={handleResume}
            className={`btn flex-1 py-1 text-xs ${colorClasses.button} text-white`}
          >
            <Play className="h-3 w-3 mr-1" />
            Продолжить
          </Button>
        )}

        <Button
          onClick={() => onEdit(taskId)}
          className={`btn py-1 text-xs ${colorClasses.button} text-white`}
          title="Редактировать комментарий"
        >
          <Pencil className="h-3 w-3" />
        </Button>

        <Button
          onClick={() => onStop(taskId)}
          className="btn btn-warning py-1 text-xs"
          title="Остановить и сохранить время"
        >
          <Square className="h-3 w-3" />
        </Button>

        {/* Кнопка завершения задачи */}
        <Button
          onClick={handleComplete}
          disabled={isCompleting}
          className="btn btn-success py-1 text-xs"
          title="Завершить задачу"
        >
          <CheckCircle className="h-3 w-3" />
        </Button>
      </div>

      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-1000 ${
            isTimeExceeded
              ? 'bg-orange-600'
              : type === 'intermediate'
                ? 'bg-purple-600'
                : 'bg-green-600'
          }`}
          style={{
            width: `${Math.min(
              (currentElapsed / config.defaultDuration) * 100,
              100
            )}%`,
          }}
        ></div>
      </div>

      {/* Индикатор загрузки при завершении задачи */}
      {isCompleting && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Завершение задачи...
        </div>
      )}
    </div>
  );
};
