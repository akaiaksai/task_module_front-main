import { CompleteTaskModalWrapper } from '@/components/tasks/task-modals';
import { Task } from '@/shared/types/task';
import { useTaskTimerStore } from '@/store/task-timer';
import Button from '@/ui/Button';
import Modal from '@/ui/Modal';
import Skeleton from '@/ui/Skeleton';
import {
  addDays,
  differenceInCalendarDays,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaskActions } from '../../../hooks/tasks/useTaskActions';
import { KanbanTaskCard } from './_kanban/KanbanTaskCard';
import { useQueryClient } from '@tanstack/react-query';
import { useTaskSelectionModalStore } from '@/store/task-selection-modal';

type Props = { tasks: Task[]; anchorDate: Date; loading?: boolean };

// Функция для вычисления новой даты при перемещении между колонками
const calculateNewDueDate = (columnKey: string, anchorDate: Date): string => {
  const baseDate = startOfDay(anchorDate);

  switch (columnKey) {
    case 'overdue':
      return format(addDays(baseDate, -1), 'yyyy-MM-dd');
    case 'today':
      return format(baseDate, 'yyyy-MM-dd');
    case 'tomorrow':
      return format(addDays(baseDate, 1), 'yyyy-MM-dd');
    case 'week': {
      const endOfCurrentWeek = endOfWeek(baseDate, { weekStartsOn: 1 });
      return format(endOfCurrentWeek, 'yyyy-MM-dd');
    }
    case 'later':
      return format(addDays(baseDate, 30), 'yyyy-MM-dd');
    case 'none':
      return '';
    default:
      return format(baseDate, 'yyyy-MM-dd');
  }
};

export default function KanbanByDue({ tasks, anchorDate, loading }: Props) {
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('09:00');
  const { startTask, requestPause, activeTaskId } = useTaskTimerStore();

  // const { createElapsedTime } = useElapsedTimeActions();

  // const saveElapsed = async (taskId: string, comment: string) => {
  //   const elapsedMs = getCurrentElapsed(taskId);
  //   const seconds = Math.floor(elapsedMs / 1000);

  //   if (seconds <= 0) {
  //     return;
  //   }

  //   try {
  //     await createElapsedTime({
  //       taskId: Number(taskId),
  //       seconds,
  //       comment,
  //     });
  //   } catch (e) {
  //     console.error(e);
  //     toast.error('Не удалось сохранить время');
  //   }
  // };

  const handleStartTask = (id: string) => startTask(id);

  const handlePauseTask = async (id: string) => {
    requestPause(id);
  };

  const handleCompleteTask = async (taskId: string) => {
    useTaskTimerStore.getState().requestPause(taskId);

    useTaskSelectionModalStore.getState().openModal({
      mode: 'complete',
      taskId,
    });
  };

  const handleCloseCompleteModal = () => {
    setIsCompleteModalOpen(false);
    setSelectedTaskId(null);
  };

  const handleCompleteSuccess = () => {
    setIsCompleteModalOpen(false);
    setSelectedTaskId(null);
  };

  const isTaskRunning = (id: string) => activeTaskId === id;

  const [sp, setSp] = useSearchParams();
  const { updateTask } = useTaskActions();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [datePickerModal, setDatePickerModal] = useState<{
    isOpen: boolean;
    task: Task | null;
    columnKey: string;
  }>({
    isOpen: false,
    task: null,
    columnKey: '',
  });

  function buildBitrixDeadline(
    date: string,
    time: string,
    portalOffsetHours: number
  ) {
    const [h, m] = time.split(':').map(Number);

    const d = new Date(`${date}T00:00:00`);
    d.setHours(h - portalOffsetHours, m, 0, 0);

    return format(d, 'yyyy-MM-dd HH:mm:ss');
  }

  const isTodayOrTomorrow =
    datePickerModal.columnKey === 'today' ||
    datePickerModal.columnKey === 'tomorrow';

  const needsDate =
    datePickerModal.columnKey === 'week' ||
    datePickerModal.columnKey === 'later';

  const [selectedDate, setSelectedDate] = useState<string>('');

  const openTaskModal = (id: string) => {
    const next = new URLSearchParams(sp);
    next.set('m', 'task');
    next.set('id', id);
    setSp(next, { replace: true });
  };

  const startOfCurrentWeek = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const endOfCurrentWeek = endOfWeek(anchorDate, { weekStartsOn: 1 });

  const cols = [
    {
      key: 'overdue',
      title: 'Просрочено',
      match: (t: Task) =>
        t.dueDate && isBefore(parseISO(t.dueDate), startOfDay(anchorDate)),
    },
    {
      key: 'today',
      title: 'Сегодня',
      match: (t: Task) =>
        t.dueDate && isSameDay(parseISO(t.dueDate), anchorDate),
    },
    {
      key: 'tomorrow',
      title: 'Завтра',
      match: (t: Task) =>
        t.dueDate &&
        differenceInCalendarDays(parseISO(t.dueDate), anchorDate) === 1,
    },
    {
      key: 'week',
      title: 'На неделе',
      match: (t: Task) => {
        if (!t.dueDate) {
          return false;
        }

        const taskDate = parseISO(t.dueDate);
        const isAfterTomorrow =
          differenceInCalendarDays(taskDate, anchorDate) > 1;

        const isWithinWeek =
          isAfter(taskDate, startOfCurrentWeek) &&
          isBefore(taskDate, addDays(endOfCurrentWeek, 1));

        return isAfterTomorrow && isWithinWeek;
      },
    },
    {
      key: 'later',
      title: 'Позже',
      match: (t: Task) => {
        if (!t.dueDate) {
          return false;
        }

        const taskDate = parseISO(t.dueDate);
        return isAfter(taskDate, endOfCurrentWeek);
      },
    },
    {
      key: 'none',
      title: 'Без срока',
      match: (t: Task) => !t.dueDate || t.dueDate === null,
    },
  ] as const;

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    columnKey: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const currentColumn = getTaskColumn(draggedTask!);
    if (currentColumn === columnKey) {
      setDraggedTask(null);
      return;
    }

    if (!draggedTask) {
      return;
    }

    if (
      columnKey === 'today' ||
      columnKey === 'tomorrow' ||
      columnKey === 'week' ||
      columnKey === 'later'
    ) {
      const defaultDate = calculateNewDueDate(columnKey, anchorDate);

      setSelectedDate(defaultDate);
      setSelectedTime('09:00');

      setDatePickerModal({
        isOpen: true,
        task: draggedTask,
        columnKey,
      });
    } else {
      await updateTaskDate(draggedTask, columnKey);
    }

    setDraggedTask(null);
  };

  const updateTaskDate = async (
    task: Task,
    columnKey: string,
    customDate?: string
  ) => {
    const newDueDate = customDate || calculateNewDueDate(columnKey, anchorDate);

    try {
      await updateTask({
        id: task.id,
        payload: {
          DEADLINE: columnKey === 'none' ? null : `${newDueDate} 00:00:00`,
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

  const handleDateConfirm = async () => {
    if (!datePickerModal.task) {
      return;
    }

    const localDeadline = `${selectedDate} ${selectedTime}:00`;
    const taskId = datePickerModal.task.id;

    const deadline = isTodayOrTomorrow
      ? buildBitrixDeadline(selectedDate, selectedTime, 5)
      : `${selectedDate} 00:00:00`;

    await updateTask({
      id: taskId,
      payload: {
        DEADLINE: deadline,
      },
    });

    queryClient.setQueriesData(
      { queryKey: ['tasks'], exact: false },
      (old: ANY) => {
        if (!old?.items) {
          return old;
        }

        return {
          ...old,
          items: old.items.map((t: Task) =>
            t.id === taskId ? { ...t, dueDate: localDeadline } : t
          ),
        };
      }
    );

    setDatePickerModal({
      isOpen: false,
      task: null,
      columnKey: '',
    });
    setSelectedDate('');
    setSelectedTime('09:00');
  };

  const handleDateCancel = () => {
    setDatePickerModal({
      isOpen: false,
      task: null,
      columnKey: '',
    });
    setSelectedDate('');
  };

  const getTaskColumn = (task: Task) => {
    return cols.find((c) => c.match(task))?.key ?? 'none';
  };

  const grouped: Record<string, Task[]> = {};
  cols.forEach((c) => (grouped[c.key] = []));
  tasks.forEach((t) => {
    const col = cols.find((c) => c.match(t))?.key ?? 'none';
    grouped[col].push(t);
  });
  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();

      // Определяем тип первого символа
      const getType = (str: string) => {
        const firstChar = str.charAt(0);
        if (/[а-яa-z]/i.test(firstChar)) {
          return 1;
        } // Буквы
        if (/[0-9]/.test(firstChar)) {
          return 2;
        } // Цифры
        return 3; // Специальные символы
      };

      const typeA = getType(titleA);
      const typeB = getType(titleB);

      // Сначала сортируем по типу символа
      if (typeA !== typeB) {
        return typeA - typeB;
      }

      // Затем по алфавиту внутри каждого типа
      return titleA.localeCompare(titleB, 'ru', { numeric: true });
    });
  });
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 h-full min-h-0">
        {cols.map((c) => (
          <div
            key={c.key}
            className="rounded-[10px] shadow-soft py-3 px-[6px] h-full min-h-0 bg-white flex flex-col overflow-hidden"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, c.key)}
          >
            <div className="text-[14px] leading-[130%] font-bold mb-2">
              {c.title}
            </div>

            <div className="space-y-2 rounded-lg overflow-y-auto pr-1 flex-1 min-h-0">
              {loading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}

              {!loading &&
                grouped[c.key].map((t) => (
                  <KanbanTaskCard
                    key={t.id}
                    task={t}
                    openTaskModal={openTaskModal}
                    handleDragStart={handleDragStart}
                    handleStartTask={handleStartTask}
                    handlePauseTask={handlePauseTask}
                    handleFinishTask={handleCompleteTask}
                    isTaskRunning={isTaskRunning}
                  />
                ))}

              {!loading && grouped[c.key].length === 0 && (
                <div className="text-sm text-neutral-500 py-8 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg h-[105px]">
                  Перетащите задачи сюда
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Модалка выбора даты */}
      <Modal
        open={datePickerModal.isOpen}
        onClose={handleDateCancel}
        title="Выберите дату выполнения"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Выберите дату для задачи:{' '}
            <strong>{datePickerModal.task?.title}</strong>
          </p>

          {needsDate && (
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
          )}

          {isTodayOrTomorrow && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Время выполнения
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button onClick={handleDateCancel}>Отмена</Button>
            <Button onClick={handleDateConfirm} disabled={!selectedDate}>
              Подтвердить
            </Button>
          </div>
        </div>
      </Modal>

      {selectedTaskId && (
        <CompleteTaskModalWrapper
          taskId={selectedTaskId}
          open={isCompleteModalOpen}
          onClose={handleCloseCompleteModal}
          onSuccess={handleCompleteSuccess}
        />
      )}
    </>
  );
}
