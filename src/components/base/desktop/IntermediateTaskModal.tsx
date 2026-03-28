import { useState } from 'react';
import Modal from '@/ui/Modal';
import Button from '@/ui/Button';
import { Play } from 'lucide-react';
import { useIntermediateTask } from '@/hooks/tasks/useIntermediateTask';
import { useAuthStore } from '@/store/auth';

export function IntermediateTaskModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [comment, setComment] = useState('');

  const { userId } = useAuthStore();
  const { createIntermediateTask, defaultDuration, isLoading } =
    useIntermediateTask({ type: 'intermediate' });

  const handleCreate = async () => {
    if (!comment.trim()) {
      return;
    }

    const id = await createIntermediateTask(comment, undefined, userId!);
    if (id) {
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Промежуточные дела"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Комментарий
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Опишите промежуточное дело…"
            className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-blue-700 text-sm">
            <strong>Максимальное время:</strong> {defaultDuration} минут
          </p>
          <p className="text-blue-700 text-xs opacity-75 mt-1">
            После {defaultDuration} минут таймер продолжит отсчёт с «+». Всё
            время будет сохранено.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="border border-gray-300"
          >
            Отмена
          </Button>

          <Button
            className="bg-blue-600 text-white hover:bg-blue-700 px-4"
            disabled={isLoading || !comment.trim()}
            onClick={handleCreate}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Создание…
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Начать
              </div>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
