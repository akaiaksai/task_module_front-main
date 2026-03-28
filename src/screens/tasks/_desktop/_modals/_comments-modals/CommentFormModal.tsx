import Button from '@/ui/Button';
import Modal from '@/ui/Modal';
import { useEffect, useState } from 'react';

interface CommentFormModalProps {
  taskId: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (commentData: { message: string }) => Promise<void>;
  mode: 'create' | 'edit';
  comment?: ANY;
  isLoading?: boolean;
}

export default function CommentFormModal({
  open,
  onClose,
  onSubmit,
  mode,
  comment,
  isLoading = false,
}: CommentFormModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && comment) {
        setMessage(comment.PostMessage.String || '');
      } else {
        setMessage('');
      }
    }
  }, [mode, comment, open]);

  const handleSubmit = async () => {
    if (!message.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ message });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        mode === 'edit' ? 'Редактирование комментария' : 'Новый комментарий'
      }
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Введите текст комментария..."
          disabled={isSubmitting || isLoading}
          autoFocus
        />

        <div className="flex justify-end space-x-2 pt-2">
          <Button
            onClick={handleClose}
            variant="ghost"
            disabled={isSubmitting || isLoading}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || isSubmitting || isLoading}
          >
            {isSubmitting || isLoading
              ? 'Сохранение...'
              : mode === 'edit'
                ? 'Сохранить'
                : 'Добавить'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
