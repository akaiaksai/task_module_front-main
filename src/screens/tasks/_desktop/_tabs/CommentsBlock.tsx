import Button from '@/ui/Button';
import Modal from '@/ui/Modal';
import Skeleton from '@/ui/Skeleton';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCommentActions } from '../../../../hooks/tasks/comments/useCommentActions';
import { useComments } from '../../../../hooks/tasks/comments/useComments';
import { useAuthStore } from '../../../../store/auth';
import { Comment } from '../../../../shared/types/comment';
import CommentFormModal from '../_modals/_comments-modals/CommentFormModal';

interface CommentsBlockProps {
  taskId: string;
}

export default function CommentsBlock({ taskId }: CommentsBlockProps) {
  const { userId, isAdmin } = useAuthStore();
  const [showAllComments, setShowAllComments] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isCommentEditModalOpen, setIsCommentEditModalOpen] = useState(false);
  const [isCommentDeleteModalOpen, setIsCommentDeleteModalOpen] =
    useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

  const dropdownRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const {
    createComment,
    updateComment,
    deleteComment,
    isLoading: isCommentActionLoading,
  } = useCommentActions(taskId);

  const { data: comments, isLoading: isCommentsLoading } = useComments(taskId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown !== null) {
        const dropdownElement = dropdownRefs.current.get(activeDropdown);
        if (
          dropdownElement &&
          !dropdownElement.contains(event.target as Node)
        ) {
          setActiveDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

  const handleAddComment = () => {
    setIsCommentModalOpen(true);
  };

  const handleEditComment = (comment: Comment) => {
    setSelectedComment(comment);
    setIsCommentEditModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDeleteComment = (comment: Comment) => {
    setSelectedComment(comment);
    setIsCommentDeleteModalOpen(true);
    setActiveDropdown(null);
  };

  const handleToggleDropdown = (commentId: number) => {
    setActiveDropdown(activeDropdown === commentId ? null : commentId);
  };

  const handleCloseCommentModal = () => {
    setIsCommentModalOpen(false);
  };

  const handleCloseCommentEditModal = () => {
    setIsCommentEditModalOpen(false);
    setSelectedComment(null);
  };

  const handleCloseCommentDeleteModal = () => {
    setIsCommentDeleteModalOpen(false);
    setSelectedComment(null);
  };

  const handleCreateComment = async (commentData: { message: string }) => {
    try {
      await createComment({ POST_MESSAGE: commentData.message });
      toast.success('Комментарий добавлен');
      handleCloseCommentModal();
    } catch (error) {
      toast.error('Не удалось добавить комментарий');
      throw error;
    }
  };

  const handleUpdateComment = async (commentData: { message: string }) => {
    if (!selectedComment) {
      return;
    }

    try {
      await updateComment({
        commentId: selectedComment.ID,
        commentData: { POST_MESSAGE: commentData.message },
      });
      toast.success('Комментарий обновлен');
      handleCloseCommentEditModal();
    } catch (error) {
      toast.error('Не удалось обновить комментарий');
      throw error;
    }
  };

  const handleDeleteCommentConfirm = async () => {
    if (!selectedComment) {
      return;
    }

    try {
      await deleteComment(selectedComment.ID);
      toast.success('Комментарий удален');
      handleCloseCommentDeleteModal();
    } catch (error: ANY) {
      console.error(error);
      toast.error('Не удалось удалить комментарий');
    }
  };

  const canEditComment = (comment: Comment): boolean => {
    if (isAdmin) {
      return true;
    }
    return comment.AuthorID === userId;
  };

  const canDeleteComment = (comment: Comment): boolean => {
    if (isAdmin) {
      return true;
    }
    return comment.AuthorID === userId;
  };

  const displayedComments = showAllComments
    ? comments?.result || []
    : (comments?.result || []).slice(0, 3); // Уменьшил количество для мобильных

  const totalComments = comments?.result?.length || 0;
  const hasMoreComments = totalComments > 3;

  // Форматирование даты для мобильных
  const formatCommentDate = (dateString: string) => {
    const date = parseISO(dateString);
    const now = new Date();
    const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');

    if (isToday) {
      return format(date, 'HH:mm', { locale: ru });
    } else {
      return format(date, 'dd.MM.yy', { locale: ru });
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Заголовок и кнопка */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Комментарии
            <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
              {totalComments}
            </span>
          </h3>
          <Button
            onClick={handleAddComment}
            className="flex items-center gap-1 w-full sm:w-auto justify-center"
            disabled={isCommentActionLoading}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Добавить комментарий</span>
            <span className="sm:hidden">Добавить</span>
          </Button>
        </div>

        {isCommentsLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 border rounded-lg bg-gray-50">
                <div className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className={`space-y-3 ${
                !showAllComments && hasMoreComments
                  ? 'max-h-80 overflow-y-auto'
                  : ''
              }`}
            >
              {displayedComments.map((comment) => (
                <div
                  key={comment.ID}
                  className="p-3 sm:p-4 border rounded-lg bg-gray-50 relative"
                >
                  {/* Шапка комментария */}
                  <div className="flex gap-3 sm:gap-4">
                    {/* Аватар */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    </div>

                    {/* Контент */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">
                            {comment.AuthorName}
                          </span>
                          <span className="hidden sm:inline text-xs text-gray-500">
                            {format(
                              parseISO(comment.PostDate),
                              'dd.MM.yyyy HH:mm',
                              { locale: ru }
                            )}
                          </span>
                          <span className="sm:hidden text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatCommentDate(comment.PostDate)}
                          </span>
                        </div>

                        {/* Кнопка меню */}
                        {(canEditComment(comment) ||
                          canDeleteComment(comment)) && (
                          <div className="relative self-start sm:self-auto">
                            <Button
                              variant="ghost"
                              className="p-1 h-6 w-6"
                              onClick={() => handleToggleDropdown(comment.ID)}
                            >
                              <MoreVertical className="h-3 w-3 text-gray-600" />
                            </Button>
                            {activeDropdown === comment.ID && (
                              <div
                                ref={(el) => {
                                  if (el) {
                                    dropdownRefs.current.set(comment.ID, el);
                                  } else {
                                    dropdownRefs.current.delete(comment.ID);
                                  }
                                }}
                                className="absolute right-0 top-6 bg-white border rounded-md shadow-lg py-1 z-10 min-w-32 sm:min-w-36"
                              >
                                {canEditComment(comment) && (
                                  <button
                                    onClick={() => handleEditComment(comment)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Pencil className="h-3 w-3" />
                                    Редактировать
                                  </button>
                                )}
                                {canDeleteComment(comment) && (
                                  <button
                                    onClick={() => handleDeleteComment(comment)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    Удалить
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Текст комментария */}
                      <p className="text-gray-800 text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {comment.PostMessage.String}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Кнопка показать/скрыть */}
            {hasMoreComments && (
              <div className="flex justify-center pt-2">
                <Button
                  onClick={() => setShowAllComments(!showAllComments)}
                  className="flex items-center gap-1"
                >
                  {showAllComments ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        Скрыть комментарии
                      </span>
                      <span className="sm:hidden">Скрыть</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        Показать все комментарии ({totalComments - 3} ещё)
                      </span>
                      <span className="sm:hidden">Ещё {totalComments - 3}</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Состояние пустого списка */}
            {totalComments === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm sm:text-base mb-2">
                  Комментариев пока нет
                </p>
                <p className="text-xs sm:text-sm text-gray-400 mb-4">
                  Будьте первым, кто оставит комментарий
                </p>
                <Button
                  onClick={handleAddComment}
                  className="flex items-center gap-1 mx-auto"
                  disabled={isCommentActionLoading}
                >
                  <Plus className="h-4 w-4" />
                  Добавить первый комментарий
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модальные окна */}
      <CommentFormModal
        taskId={taskId}
        open={isCommentModalOpen}
        onClose={handleCloseCommentModal}
        onSubmit={handleCreateComment}
        mode="create"
        isLoading={isCommentActionLoading}
      />

      {selectedComment && (
        <CommentFormModal
          taskId={taskId}
          open={isCommentEditModalOpen}
          onClose={handleCloseCommentEditModal}
          onSubmit={handleUpdateComment}
          mode="edit"
          comment={selectedComment}
          isLoading={isCommentActionLoading}
        />
      )}

      <Modal
        open={isCommentDeleteModalOpen}
        onClose={handleCloseCommentDeleteModal}
        title="Удаление комментария"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Вы уверены, что хотите удалить этот комментарий? Это действие нельзя
            отменить.
          </p>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2 pt-4">
            <Button
              type="button"
              onClick={handleCloseCommentDeleteModal}
              className="order-2 sm:order-1"
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleDeleteCommentConfirm}
              className="bg-red-600 hover:bg-red-700 text-white order-1 sm:order-2"
              disabled={isCommentActionLoading}
            >
              {isCommentActionLoading ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
