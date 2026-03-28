import Button from '@/ui/Button';
import Modal from '@/ui/Modal';

interface DeleteTaskModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
  isLoading?: boolean;
}

export default function DeleteTaskModal({
  open,
  onClose,
  onConfirm,
  taskTitle,
  isLoading = false,
}: DeleteTaskModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Удаление задачи"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          Вы уверены, что хотите удалить задачу{' '}
          <span className="font-semibold">&quot;{taskTitle}&quot;</span>?
        </p>
        <p className="text-sm text-gray-500">
          Это действие нельзя отменить. Задача будет удалена без возможности
          восстановления.
        </p>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-300"
          >
            {isLoading ? 'Удаление...' : 'Удалить'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
