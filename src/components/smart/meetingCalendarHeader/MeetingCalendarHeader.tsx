import { Task } from '@/shared/types/task';
import { useAuthStore } from '@/store/auth';
import { useTaskFiltersStore } from '@/store/task-filters';
import { isSameDay, parseISO } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MeetingCardHeader } from '../meetingCardHeader';

interface MeetingCalendarProps {
  isOpen: boolean;
  onCreateMeeting?: () => void;
  tasks: Task[];
  backgroundColor?: string;
  showCreateButton?: boolean;
  maxHeightPercentage?: number;
  taskType?: 'meeting' | 'task';
  showTime?: boolean;
}

export function MeetingCalendarHeader({
  isOpen,
  tasks,
  maxHeightPercentage = 80,
  taskType = 'meeting',
}: MeetingCalendarProps) {
  const { selectedDate } = useTaskFiltersStore();
  const { userId } = useAuthStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  console.log(tasks, 'tasks');

  useEffect(() => {
    if (isOpen && taskType === 'meeting') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setExpandedGroup(null);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const filteredMeetings = useMemo(() => {
    if (taskType === 'task') {
      return tasks;
    } else {
      return tasks
        .filter((task) => {
          if (!task.dueDate) {
            return false;
          }

          const taskDate = parseISO(task.dueDate);
          const isOnSelectedDate = isSameDay(taskDate, selectedDate);

          const isParticipant =
            task.assigneeId === userId ||
            task.accomplices?.includes(userId as number);

          return isOnSelectedDate && isParticipant;
        })
        .sort((a, b) => {
          if (!a.dueDate || !b.dueDate) {
            return 0;
          }
          return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
        });
    }
  }, [tasks, selectedDate, userId, taskType]);

  const { tasksWithTime, tasksWithoutTime } = useMemo(() => {
    const withTime: Task[] = [];
    const withoutTime: Task[] = [];

    filteredMeetings.forEach((task) => {
      if (task.dueDate) {
        withTime.push(task);
      } else {
        withoutTime.push(task);
      }
    });

    return { tasksWithTime: withTime, tasksWithoutTime: withoutTime };
  }, [filteredMeetings]);

  const taskGroups = useMemo(() => {
    const groupedTasks = tasksWithTime.reduce(
      (groups, task) => {
        if (!task.dueDate) {
          return groups;
        }

        const taskTime = parseISO(task.dueDate).toTimeString().slice(0, 5);

        if (!groups[taskTime]) {
          groups[taskTime] = [];
        }

        groups[taskTime].push(task);
        return groups;
      },
      {} as Record<string, Task[]>
    );

    return Object.entries(groupedTasks).map(([time, tasks]) => ({
      time,
      tasks,
    }));
  }, [tasksWithTime]);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      const height = contentRef.current.scrollHeight;
      const maxHeight = window.innerHeight * (maxHeightPercentage / 100);
      setContentHeight(Math.min(height, maxHeight));
    } else {
      setContentHeight(0);
    }
  }, [
    isOpen,
    taskGroups,
    expandedGroup,
    tasksWithoutTime,
    maxHeightPercentage,
  ]);

  // const toggleGroup = (time: string) => {
  //   setExpandedGroup((current) => (current === time ? null : time));
  // };

  const maxHeightVh = `${maxHeightPercentage}vh`;

  const emptyStateText = {
    main: 'Встреч на эту дату нет',
    secondary: 'или вы не являетесь участником',
  };

  return (
    <div
      className={`
        transition-all duration-300 
        overflow-hidden
        relative left-0 right-0 bottom-0 
        z-[999]
      `}
      style={{
        maxHeight: `${contentHeight}px`,
        opacity: isOpen ? 1 : 0,
      }}
    >
      {/* Список встреч с прокруткой */}
      <div
        ref={contentRef}
        className="h-full overflow-y-auto overscroll-contain"
        style={{
          maxHeight: maxHeightVh,
        }}
      >
        {filteredMeetings.length === 0 ? (
          <div className="flex flex-col items-center text-[16px] text-white justify-center py-8">
            <p>{emptyStateText.main}</p>
            <p className="mt-1">{emptyStateText.secondary}</p>
          </div>
        ) : (
          <div className="py-2">
            {/* Задачи с временем (группированные) */}
            {taskGroups.length > 0 && (
              <div className="px-3">
                {taskGroups.map((group) => {
                  const isGroupExpanded = expandedGroup === group.time;

                  if (group.tasks.length === 1) {
                    // Одиночная задача
                    return (
                      <MeetingCardHeader
                        key={group.tasks[0].id}
                        task={group.tasks[0]}
                      />
                    );
                  } else {
                    if (!isGroupExpanded) {
                      // Группа закрыта - показываем только первую задачу с блоком управления
                      return (
                        <MeetingCardHeader
                          key={`${group.time}-header`}
                          task={group.tasks[0]}
                        />
                      );
                    } else {
                      // Группа раскрыта - показываем все задачи
                      return group.tasks.map((task) => (
                        <MeetingCardHeader key={task.id} task={task} />
                      ));
                    }
                  }
                })}
              </div>
            )}

            {/* Задачи без времени (простой список) */}
            {tasksWithoutTime.length > 0 && (
              <div className="mt-4">
                {tasksWithoutTime.map((task) => (
                  <MeetingCardHeader key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Кнопка создания встречи */}
      {/* {isOpen && showCreateButton && onCreateMeeting && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={onCreateMeeting}
            className="w-14 h-14 bg-black rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label={
              taskType === 'meeting' ? 'Создать встречу' : 'Создать задачу'
            }
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>
      )} */}
    </div>
  );
}
