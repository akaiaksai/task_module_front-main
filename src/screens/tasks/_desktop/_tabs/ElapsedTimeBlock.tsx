import Button from '@/ui/Button';
import Skeleton from '@/ui/Skeleton';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import Modal from '@/ui/Modal';

import { toast } from 'sonner';
import { useElapsedTimeActions } from '../../../../hooks/tasks/elapsed-times/useElapsedTimeActions';
import { useElapsedTimes } from '../../../../hooks/tasks/elapsed-times/useElapsedTimes';
import { useUserLocal } from '../../../../hooks/users/useUserLocal';
import { useAuthStore } from '../../../../store/auth';
import {
  ApiElapsedTimeItem,
  CommentText,
} from '../../../../shared/types/elapsed-time';

interface ElapsedTimeBlockProps {
  taskId: string;
}

interface DayGroup {
  date: Date;
  dateString: string;
  formattedDate: string;
  totalSeconds: number;
  items: ApiElapsedTimeItem[];
  isExpanded: boolean;
}

interface ElapsedTimeFormData {
  hours: string;
  minutes: string;
  comment: string;
  date: string; // Дата для записи
}

export default function ElapsedTimeBlock({ taskId }: ElapsedTimeBlockProps) {
  const { userId, isAdmin } = useAuthStore();
  const { getDisplayNameById, isLoading: usersLoading } =
    useUserLocal.useUsersMap();
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<ApiElapsedTimeItem | null>(
    null
  );
  const [formData, setFormData] = useState<ElapsedTimeFormData>({
    hours: '1',
    minutes: '0',
    comment: '',
    date: format(new Date(), 'yyyy-MM-dd'), // Текущая дата по умолчанию
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const {
    createElapsedTime,
    updateElapsedTime,
    deleteElapsedTime,
    isLoading: isElapsedTimeActionLoading,
  } = useElapsedTimeActions();

  const { data: elapsedTimes, isLoading: isElapsedTimesLoading } =
    useElapsedTimes(taskId);

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

  useEffect(() => {
    if (isCreateModalOpen) {
      setFormData({
        hours: '1',
        minutes: '0',
        comment: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [isCreateModalOpen]);

  // Группировка по дням
  const groupByDays = (): DayGroup[] => {
    if (!elapsedTimes?.result) {
      return [];
    }

    const groups: Record<string, DayGroup> = {};

    elapsedTimes.result.forEach((item) => {
      const date = new Date(item.DateStart);
      const dateKey = format(date, 'yyyy-MM-dd');
      const formattedDate = format(date, 'dd MMMM yyyy', { locale: ru });

      if (!groups[dateKey]) {
        groups[dateKey] = {
          date,
          dateString: dateKey,
          formattedDate,
          totalSeconds: 0,
          items: [],
          isExpanded: expandedDays.has(dateKey),
        };
      }

      groups[dateKey].items.push(item);
      groups[dateKey].totalSeconds += item.Seconds;
    });

    // Сортируем дни по убыванию (новые сверху)
    return Object.values(groups).sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  };

  const handleToggleDropdown = (timeId: number) => {
    setActiveDropdown(activeDropdown === timeId ? null : timeId);
  };

  const handleToggleDay = (dateString: string) => {
    const newExpandedDays = new Set(expandedDays);
    if (newExpandedDays.has(dateString)) {
      newExpandedDays.delete(dateString);
    } else {
      newExpandedDays.add(dateString);
    }
    setExpandedDays(newExpandedDays);
  };

  const handleCreateTime = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditTime = (time: ApiElapsedTimeItem) => {
    setSelectedTime(time);

    // Вычисляем часы и минуты из секунд
    const totalMinutes = Math.floor(time.Seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    const commentText = time.CommentText.Valid ? time.CommentText.String : '';
    const date = format(new Date(time.DateStart), 'yyyy-MM-dd');

    setFormData({
      hours: hours.toString(),
      minutes: minutes.toString(),
      comment: commentText,
      date,
    });

    setIsEditModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDeleteTime = (time: ApiElapsedTimeItem) => {
    setSelectedTime(time);
    setIsDeleteModalOpen(true);
    setActiveDropdown(null);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setFormData({
      hours: '1',
      minutes: '0',
      comment: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    setIsSubmitting(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTime(null);
    setFormData({
      hours: '1',
      minutes: '0',
      comment: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    setIsSubmitting(false);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedTime(null);
  };

  const handleFormChange = (
    field: keyof ElapsedTimeFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Вычисляем общее количество секунд из часов и минут
  const calculateSeconds = (): number => {
    const hours = parseInt(formData.hours) || 0;
    const minutes = parseInt(formData.minutes) || 0;

    if (hours === 0 && minutes === 0) {
      return 0;
    }

    return hours * 3600 + minutes * 60;
  };

  // Проверяем, изменились ли данные
  const hasChanges = (): boolean => {
    if (!selectedTime) {
      return false;
    }

    // Проверяем изменился ли комментарий
    const currentComment = selectedTime.CommentText.Valid
      ? selectedTime.CommentText.String
      : '';
    if (formData.comment !== currentComment) {
      return true;
    }

    // Проверяем изменилось ли время
    const totalMinutes = Math.floor(selectedTime.Seconds / 60);
    const originalHours = Math.floor(totalMinutes / 60);
    const originalMinutes = totalMinutes % 60;

    return (
      parseInt(formData.hours) !== originalHours ||
      parseInt(formData.minutes) !== originalMinutes
    );
  };

  const handleCreateTimeSubmit = async () => {
    const seconds = calculateSeconds();
    if (seconds === 0) {
      toast.error('Укажите количество часов и/или минут');
      return;
    }

    setIsSubmitting(true);

    try {
      await createElapsedTime({
        taskId: Number(taskId),
        seconds,
        comment: formData.comment,
      });
      handleCloseCreateModal();
    } catch (error: ANY) {
      console.error(error);
      toast.error('Ошибка при создании времени');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTime = async () => {
    if (!selectedTime) {
      toast.error('No selected time for update');
      return;
    }

    if (!hasChanges()) {
      toast.error('No changes detected');
      handleCloseEditModal();
      return;
    }

    const seconds = calculateSeconds();
    if (seconds === 0) {
      toast.error('Укажите количество часов и/или минут');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateElapsedTime({
        taskId,
        itemId: selectedTime.ID,
        elapsedTimeData: {
          seconds,
          comment: formData.comment,
        },
      });
      toast.success('Time updated successfully');
      handleCloseEditModal();
    } catch (error: ANY) {
      console.error(error);
      toast.error('Ошибка при обновлении времени');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTime) {
      return;
    }

    try {
      await deleteElapsedTime({
        taskId,
        itemId: selectedTime.ID,
      });
      handleCloseDeleteModal();
    } catch (error: ANY) {
      console.error(error);
      toast.error('Ошибка при удалении времени');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) {
      return `${minutes}м`;
    }
    if (minutes === 0) {
      return `${hours}ч`;
    }
    return `${hours}ч ${minutes}м`;
  };

  const getCommentText = (commentText: CommentText): string => {
    return commentText.Valid ? commentText.String : '';
  };

  const hasComment = (commentText: CommentText): boolean => {
    return commentText.Valid && commentText.String.trim().length > 0;
  };

  const canEditTime = (time: ApiElapsedTimeItem): boolean => {
    if (isAdmin) {
      return true;
    }
    return time.UserID === userId;
  };

  const canDeleteTime = (time: ApiElapsedTimeItem): boolean => {
    if (isAdmin) {
      return true;
    }
    return time.UserID === userId;
  };

  // Вычисляем общее время
  const totalTime =
    elapsedTimes?.result?.reduce((total, time) => total + time.Seconds, 0) || 0;
  const dayGroups = groupByDays();

  const calculatedSeconds = calculateSeconds();
  const calculatedDuration = formatDuration(calculatedSeconds);

  return (
    <div className="space-y-4 relative">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Затраченное время
          </h3>
          {!isElapsedTimesLoading && elapsedTimes?.result && (
            <p className="text-sm text-gray-500 mt-1">
              Всего: {formatDuration(totalTime)} • {elapsedTimes.result.length}{' '}
              записей • {dayGroups.length} дней
            </p>
          )}
        </div>

        <Button
          onClick={handleCreateTime}
          className="flex items-center gap-1"
          disabled={isElapsedTimeActionLoading}
        >
          <Plus className="h-4 w-4" />
          Добавить время
        </Button>
      </div>

      {/* Кнопки для управления всеми группами */}
      {dayGroups.length > 0 && (
        <div className="bg-white flex gap-2 pt-2 pb-2 shadow-sm">
          <Button
            onClick={() => {
              const allDates = dayGroups.map((group) => group.dateString);
              setExpandedDays(new Set(allDates));
            }}
            className="text-xs"
          >
            Развернуть все
          </Button>
          <Button
            onClick={() => setExpandedDays(new Set())}
            className="text-xs"
          >
            Свернуть все
          </Button>
        </div>
      )}

      {isElapsedTimesLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {dayGroups.map((dayGroup) => (
            <div
              key={dayGroup.dateString}
              className="border rounded-lg overflow-hidden"
            >
              {/* Заголовок дня */}
              <div
                className="bg-gray-100 px-4 py-3 cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => handleToggleDay(dayGroup.dateString)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {dayGroup.isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    )}
                    <span className="font-semibold text-gray-800">
                      {dayGroup.formattedDate}
                    </span>
                    <span className="text-sm text-gray-600">
                      {dayGroup.items.length}{' '}
                      {dayGroup.items.length === 1
                        ? 'запись'
                        : dayGroup.items.length < 5
                          ? 'записи'
                          : 'записей'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-blue-600">
                      {formatDuration(dayGroup.totalSeconds)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Список записей за день */}
              {dayGroup.isExpanded && (
                <div className="divide-y">
                  {dayGroup.items.map((time) => (
                    <div
                      key={time.ID}
                      className="p-4 bg-white relative hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-sm">
                            {usersLoading ? (
                              <Skeleton className="h-4 w-20 inline-block" />
                            ) : (
                              getDisplayNameById(time.UserID) ||
                              `Пользователь #${time.UserID}`
                            )}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {formatDuration(time.Seconds)}
                          </span>
                        </div>

                        {(canEditTime(time) || canDeleteTime(time)) && (
                          <div className="relative">
                            <Button
                              variant="ghost"
                              className="p-1 h-6 w-6"
                              onClick={() => handleToggleDropdown(time.ID)}
                            >
                              <div className="text-gray-800">
                                <MoreVertical className="h-3 w-3" />
                              </div>
                            </Button>
                            {activeDropdown === time.ID && (
                              <div
                                ref={(el) => {
                                  if (el) {
                                    dropdownRefs.current.set(time.ID, el);
                                  } else {
                                    dropdownRefs.current.delete(time.ID);
                                  }
                                }}
                                className="absolute right-0 top-6 bg-white border rounded-md shadow-lg py-1 z-10 min-w-32"
                              >
                                {canEditTime(time) && (
                                  <button
                                    onClick={() => handleEditTime(time)}
                                    className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Pencil className="h-3 w-3" />
                                    Редактировать
                                  </button>
                                )}
                                {canDeleteTime(time) && (
                                  <button
                                    onClick={() => handleDeleteTime(time)}
                                    className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
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

                      {/* Комментарий всегда отображается под временем */}
                      <div className="mt-2">
                        {hasComment(time.CommentText) ? (
                          <p className="text-sm text-gray-700 whitespace-pre-wrap bg-blue-50 p-2 rounded border border-blue-100">
                            {getCommentText(time.CommentText)}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            Без комментария
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {(!elapsedTimes?.result || elapsedTimes.result.length === 0) && (
            <div className="text-center py-8 text-gray-500 border rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>Затраченное время не указано</p>
              <Button
                onClick={handleCreateTime}
                className="mt-2"
                disabled={isElapsedTimeActionLoading}
              >
                Добавить первую запись
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Модалка создания времени */}
      <Modal
        open={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title="Добавление затраченного времени"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleFormChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Часы
              </label>
              <input
                type="number"
                min="0"
                max="24"
                value={formData.hours}
                onChange={(e) => handleFormChange('hours', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Минуты
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={formData.minutes}
                onChange={(e) => handleFormChange('minutes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          {calculatedSeconds > 0 && (
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Длительность:</strong> {calculatedDuration}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Комментарий
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => handleFormChange('comment', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Добавьте комментарий к затраченному времени..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              onClick={handleCloseCreateModal}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleCreateTimeSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting || calculatedSeconds === 0}
            >
              {isSubmitting ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модалка редактирования времени */}
      <Modal
        open={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Редактирование затраченного времени"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дата
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleFormChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Часы
              </label>
              <input
                type="number"
                min="0"
                max="24"
                value={formData.hours}
                onChange={(e) => handleFormChange('hours', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Минуты
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={formData.minutes}
                onChange={(e) => handleFormChange('minutes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          {calculatedSeconds > 0 && (
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Длительность:</strong> {calculatedDuration}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Комментарий
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => handleFormChange('comment', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Добавьте комментарий к затраченному времени..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              onClick={handleCloseEditModal}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleUpdateTime}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модалка подтверждения удаления */}
      <Modal
        open={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Удаление записи о времени"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Вы уверены, что хотите удалить эту запись о затраченном времени? Это
            действие нельзя отменить.
          </p>

          {selectedTime && (
            <div className="bg-red-50 p-3 rounded border border-red-200">
              <p className="text-sm text-red-800">
                <strong>Длительность:</strong>{' '}
                {formatDuration(selectedTime.Seconds)}
              </p>
              {hasComment(selectedTime.CommentText) ? (
                <p className="text-sm text-red-800 mt-1">
                  <strong>Комментарий:</strong>{' '}
                  {getCommentText(selectedTime.CommentText)}
                </p>
              ) : (
                <p className="text-sm text-red-800 mt-1 italic">
                  Без комментария
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" onClick={handleCloseDeleteModal}>
              Отмена
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isElapsedTimeActionLoading}
            >
              {isElapsedTimeActionLoading ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
