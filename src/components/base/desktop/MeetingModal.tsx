import Modal from '@/ui/Modal';
import Button from '@/ui/Button';
import { Calendar } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useIntermediateTask } from '@/hooks/tasks/useIntermediateTask';
import { toast } from 'sonner';

export function MeetingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [comment, setComment] = useState('');
  const { userId } = useAuthStore();

  const { createIntermediateTask, defaultDuration, isLoading } =
    useIntermediateTask({ type: 'meeting' });

  const create = async () => {
    const id = await createIntermediateTask(comment, defaultDuration, userId!);
    if (id) {
      onClose();
      toast.success('Встреча создана');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Встреча" maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Комментарий</label>
          <textarea
            className="w-full border rounded-md px-3 py-2 resize-none"
            rows={3}
            placeholder="Опишите встречу..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <div className="bg-green-50 border border-green-200 p-3 rounded-md">
          <p className="text-green-700 text-sm">
            Максимальное время: {defaultDuration} минут
          </p>
          <p className="text-xs text-green-600 opacity-70">
            После {defaultDuration} минут таймер начнёт отсчёт с «+».
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>

          <Button
            className="bg-green-600 text-white px-4"
            onClick={create}
            disabled={isLoading || !comment.trim()}
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 rounded-full border-2 border-white/30 border-t-white mr-2" />
                Создание...
              </>
            ) : (
              <>
                <div className="flex cursor-pointer">
                  <Calendar className="h-4 w-4 mr-2" />
                  Начать
                </div>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
