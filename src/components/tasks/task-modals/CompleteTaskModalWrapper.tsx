import { useState } from 'react';
import { toast } from 'sonner';
import { useCommentActions } from '@/hooks/tasks/comments/useCommentActions';
import { useCompleteTask } from '@/hooks/tasks/useTaskActions';
import CommentFormModal from '@/screens/tasks/_desktop/_modals/_comments-modals/CommentFormModal';
import { addCommentAsResult } from '@/lib/api/tasks/results';

export function CompleteTaskModalWrapper({
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
  const { completeTask, isLoading: isCompleting } = useCompleteTask();
  const { createComment, isLoading: isCreatingComment } =
    useCommentActions(taskId);
  const [isAddingResult, setIsAddingResult] = useState(false);

  const isLoading = isCompleting || isCreatingComment || isAddingResult;

  const handleSubmit = async (commentData: { message: string }) => {
    try {
      let commentId: number | undefined;

      if (commentData.message.trim()) {
        const commentResponse = await createComment({
          POST_MESSAGE: `Задача завершена. Комментарий: ${commentData.message}`,
        });
        commentId = commentResponse.commentId;
      } else {
        const commentResponse = await createComment({
          POST_MESSAGE: 'Задача завершена',
        });
        commentId = commentResponse.commentId;
      }

      await completeTask({ taskId });

      if (commentId) {
        setIsAddingResult(true);
        try {
          await addCommentAsResult(taskId, commentId);
        } finally {
          setIsAddingResult(false);
        }
      }

      toast.success('Задача завершена и результат закреплен');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Ошибка при завершении задачи:', error);
      toast.error('Не удалось завершить задачу');
      throw error;
    }
  };

  return (
    <CommentFormModal
      taskId={taskId}
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      mode="create"
    />
  );
}
