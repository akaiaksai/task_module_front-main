import { toast } from 'sonner';
import { useCommentActions } from '@/hooks/tasks/comments/useCommentActions';
import CommentFormModal from '@/screens/tasks/_desktop/_modals/_comments-modals/CommentFormModal';

export function CreateCommentModalWrapper({
  taskId,
  open,
  onClose,
  onSuccess,
}: {
  taskId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { createComment, isLoading } = useCommentActions(taskId);

  const handleSubmit = async (commentData: { message: string }) => {
    try {
      await createComment({ POST_MESSAGE: commentData.message });
      toast.success('Комментарий добавлен');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Ошибка при добавлении комментария:', error);
      throw error;
    }
  };

  return (
    <CommentFormModal
      taskId={taskId}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      mode="create"
      isLoading={isLoading}
    />
  );
}
