// components/tasks/IntermediateTaskModal.tsx
import { useIntermediateTask } from '@/hooks/tasks/useIntermediateTask';
import Button from '@/ui/Button';
import Modal from '@/ui/Modal';
import Textarea from '@/ui/Textarea';
import { AlertCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface IntermediateTaskModalProps {
  open: boolean;
  onClose: () => void;
  type?: 'intermediate' | 'meeting';
  taskId?: string; // Для редактирования существующей задачи
  userId: number;
  onTaskCreated?: (taskId: string) => void;
  onTaskUpdated?: () => void;
}

export const IntermediateTaskModal = ({
  open,
  onClose,
  type = 'intermediate',
  taskId,
  userId,
  onTaskCreated,
  onTaskUpdated,
}: IntermediateTaskModalProps) => {
  const [comment, setComment] = useState('');
  const [duration, setDuration] = useState(type === 'meeting' ? 10 : 20);
  const [isEditing, setIsEditing] = useState(false);

  const { createIntermediateTask, updateIntermediateTask, isLoading, title } =
    useIntermediateTask({ type });

  // Сбрасываем состояние при открытии/закрытии
  useEffect(() => {
    if (open) {
      setDuration(type === 'meeting' ? 10 : 20);
      setIsEditing(!!taskId);

      if (!taskId) {
        setComment('');
      }
    }
  }, [open, taskId, type]);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error('Пожалуйста, добавьте комментарий');
      return;
    }

    if (isEditing && taskId) {
      // Редактирование существующей задачи
      const success = await updateIntermediateTask(taskId, comment, duration);
      if (success) {
        onTaskUpdated?.();
        onClose();
      }
    } else {
      // Создание новой задачи
      const newTaskId = await createIntermediateTask(comment, duration, userId);
      if (newTaskId) {
        onTaskCreated?.(newTaskId);
        onClose();
      }
    }
  };

  const handleClose = () => {
    setComment('');
    onClose();
  };

  const getColorClasses = () => {
    const colors = {
      intermediate: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-600',
        button: 'bg-blue-600 hover:bg-blue-700',
      },
      meeting: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: 'text-green-600',
        button: 'bg-green-600 hover:bg-green-700',
      },
    };
    return colors[type];
  };

  const colorClasses = getColorClasses();

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? `Редактирование ${title.toLowerCase()}` : title}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Комментарий *
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={
              type === 'intermediate'
                ? 'Опишите, что вы планируете сделать...'
                : 'Опишите тему встречи...'
            }
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="h-4 w-4 inline mr-1" />
            Планируемое время (минуты) *
          </label>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min="1"
                max="480" // 8 часов
                step="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center text-sm text-gray-500">минут</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {duration * 60} секунд будет сохранено как TIME_ESTIMATE
          </p>
        </div>

        {/* Информационный блок */}
        <div
          className={`p-3 rounded border ${colorClasses.bg} ${colorClasses.border}`}
        >
          <div className="flex items-start gap-2">
            <AlertCircle className={`h-4 w-4 mt-0.5 ${colorClasses.icon}`} />
            <div>
              <p className={`text-sm font-medium ${colorClasses.text}`}>
                {type === 'intermediate' ? 'Промежуточные дела' : 'Встреча'}
              </p>
              <p className={`text-xs ${colorClasses.text} opacity-80 mt-1`}>
                {type === 'intermediate'
                  ? 'Эти задачи помогают организовать мелкие дела в течение дня.'
                  : 'Встречи и совещания с коллегами или клиентами.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            className={colorClasses.button}
            disabled={!comment.trim() || isLoading}
          >
            {isLoading ? 'Сохранение...' : isEditing ? 'Обновить' : 'Создать'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
