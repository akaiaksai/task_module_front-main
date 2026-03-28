import {
  addDays,
  differenceInCalendarDays,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  parseISO,
} from 'date-fns';
import { X } from 'lucide-react';
import { useState } from 'react';
import { getDisplayName } from '../../hooks/groups/useGroupsAndMembers';
import { useTaskActions } from '../../hooks/tasks/useTaskActions';

export function KanbanByDue({
  members,
  onTaskClick,
}: {
  members: ANY[];
  onTaskClick: (taskId: string) => void;
}) {
  const anchorDate = new Date();
  const { updateTask } = useTaskActions();

  // Состояние для модалки выбора даты
  const [datePickerModal, setDatePickerModal] = useState<{
    isOpen: boolean;
    task: ANY | null;
    columnKey: string;
  }>({
    isOpen: false,
    task: null,
    columnKey: '',
  });

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [draggedTask, setDraggedTask] = useState<ANY | null>(null);

  // Функция для получения начала дня
  const startOfDay = (d: Date) => {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  // Функция для вычисления новой даты при перемещении между колонками
  const calculateNewDueDate = (columnKey: string): string => {
    const baseDate = startOfDay(anchorDate);

    switch (columnKey) {
      case 'overdue':
        // Вчера
        return format(addDays(baseDate, -1), 'yyyy-MM-dd');
      case 'today':
        // Сегодня
        return format(baseDate, 'yyyy-MM-dd');
      case 'tomorrow':
        // Завтра
        return format(addDays(baseDate, 1), 'yyyy-MM-dd');
      case 'week': {
        // Конец текущей недели (воскресенье)
        const endOfCurrentWeek = endOfWeek(baseDate, { weekStartsOn: 1 });
        return format(endOfCurrentWeek, 'yyyy-MM-dd');
      }
      case 'later':
        // Через 30 дней
        return format(addDays(baseDate, 30), 'yyyy-MM-dd');
      case 'none':
        return ''; // Без срока
      default:
        return format(baseDate, 'yyyy-MM-dd');
    }
  };

  // Колонки канбана
  const cols = [
    {
      key: 'overdue',
      title: 'Просрочено',
      match: (t: ANY) =>
        t.dueDate && isBefore(parseISO(t.dueDate), startOfDay(anchorDate)),
    },
    {
      key: 'today',
      title: 'Сегодня',
      match: (t: ANY) =>
        t.dueDate && isSameDay(parseISO(t.dueDate), anchorDate),
    },
    {
      key: 'tomorrow',
      title: 'Завтра',
      match: (t: ANY) =>
        t.dueDate &&
        differenceInCalendarDays(parseISO(t.dueDate), anchorDate) === 1,
    },
    {
      key: 'week',
      title: 'На неделе',
      match: (t: ANY) => {
        if (!t.dueDate) {
          return false;
        }
        const diff = differenceInCalendarDays(parseISO(t.dueDate), anchorDate);
        return diff > 1 && diff <= 7;
      },
    },
    {
      key: 'later',
      title: 'Позже',
      match: (t: ANY) => {
        if (!t.dueDate) {
          return false;
        }
        return differenceInCalendarDays(parseISO(t.dueDate), anchorDate) > 7;
      },
    },
    { key: 'none', title: 'Без срока', match: (t: ANY) => !t.dueDate },
  ] as const;

  // Обработчики drag and drop
  const handleDragStart = (task: ANY) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (columnKey: string) => {
    if (!draggedTask) {
      return;
    }

    // Для колонок "week" и "later" открываем модалку выбора даты
    if (columnKey === 'week' || columnKey === 'later') {
      // Устанавливаем дату по умолчанию в зависимости от колонки
      const defaultDate = calculateNewDueDate(columnKey);
      setSelectedDate(defaultDate);
      setDatePickerModal({
        isOpen: true,
        task: draggedTask,
        columnKey,
      });
    } else {
      // Для остальных колонок сразу обновляем дату
      await updateTaskDate(draggedTask, columnKey);
    }

    setDraggedTask(null);
  };

  // Функция для обновления даты задачи
  const updateTaskDate = async (
    task: ANY,
    columnKey: string,
    customDate?: string
  ) => {
    const newDueDate = customDate || calculateNewDueDate(columnKey);

    try {
      await updateTask({
        id: task.id,
        payload: {
          DEADLINE: newDueDate ? `${newDueDate}T00:00:00Z` : null,
          // Сохраняем остальные поля задачи без изменений
          TITLE: task.title,
          DESCRIPTION: task.description,
          RESPONSIBLE_ID: task.assigneeId,
          GROUP_ID: task.groupId,
          ACCOMPLICES: task.accomplices || [],
          AUDITORS: task.auditors || [],
          PARENT_ID: task.parentId,
        },
      });
    } catch (error) {
      console.error('Ошибка при обновлении задачи:', error);
    }
  };

  // Обработчик подтверждения выбора даты
  const handleDateConfirm = async () => {
    if (!datePickerModal.task) {
      return;
    }

    await updateTaskDate(
      datePickerModal.task,
      datePickerModal.columnKey,
      selectedDate
    );

    setDatePickerModal({
      isOpen: false,
      task: null,
      columnKey: '',
    });
    setSelectedDate('');
  };

  // Обработчик отмены выбора даты
  const handleDateCancel = () => {
    setDatePickerModal({
      isOpen: false,
      task: null,
      columnKey: '',
    });
    setSelectedDate('');
  };

  // Собираем все задачи всех пользователей
  const allTasks = members.flatMap(({ user, tasks }) =>
    tasks.map((task: ANY) => ({ ...task, user }))
  );

  // Группируем задачи по колонкам
  const grouped: Record<string, ANY[]> = {};
  cols.forEach((c) => (grouped[c.key] = []));
  allTasks.forEach((t) => {
    const col = cols.find((c) => c.match(t))?.key ?? 'none';
    grouped[col].push(t);
  });

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cols.map((c) => (
          <div
            key={c.key}
            className="card p-3 min-h-[200px]"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(c.key)}
          >
            <div className="text-sm font-semibold mb-2">{c.title}</div>
            <div className="space-y-2">
              {grouped[c.key].map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  className="w-full text-left rounded-2xl border p-3 bg-white hover:bg-neutral-50 transition cursor-grab active:cursor-grabbing"
                  onClick={() => onTaskClick(task.id)}
                >
                  <div className="text-sm font-medium line-clamp-2">
                    {task.title}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-neutral-500 truncate">
                      {getDisplayName(task.user)}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-neutral-500 whitespace-nowrap ml-2">
                        {format(parseISO(task.dueDate), 'dd.MM')}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {grouped[c.key].length === 0 && (
                <div className="text-sm text-neutral-500 py-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                  Перетащите задачи сюда
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Модалка выбора даты */}
      {datePickerModal.isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
            onClick={handleDateCancel}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Заголовок */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Выберите дату выполнения
                </h2>
                <button
                  onClick={handleDateCancel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Контент */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Выберите дату для задачи:{' '}
                    <strong>{datePickerModal.task?.title}</strong>
                  </p>

                  <div>
                    <label
                      htmlFor="due-date"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Дата выполнения
                    </label>
                    <input
                      type="date"
                      id="due-date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                </div>
              </div>

              {/* Футер */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={handleDateCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDateConfirm}
                  disabled={!selectedDate}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Подтвердить
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
