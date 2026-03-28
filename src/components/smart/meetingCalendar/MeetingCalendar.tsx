import { Task } from '@/shared/types/task';
import { useAuthStore } from '@/store/auth';
import { useTaskFiltersStore } from '@/store/task-filters';
import { isSameDay, parseISO } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MeetingCard } from '../meetingCard';

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

export function MeetingCalendar({
  isOpen,
  tasks,
  maxHeightPercentage = 80,
  taskType = 'meeting',
  showTime = true,
}: MeetingCalendarProps) {
  const { selectedDate } = useTaskFiltersStore();
  const { userId } = useAuthStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

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

  const toggleGroup = (time: string) => {
    setExpandedGroup((current) => (current === time ? null : time));
  };

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
                {taskGroups.map((group, groupIndex) => {
                  const isLastGroup = groupIndex === taskGroups.length - 1;
                  const isGroupExpanded = expandedGroup === group.time;

                  if (group.tasks.length === 1) {
                    // Одиночная задача
                    return (
                      <MeetingCard
                        key={group.tasks[0].id}
                        task={group.tasks[0]}
                        isLast={isLastGroup}
                        showTime={showTime}
                        taskType={taskType}
                      />
                    );
                  } else {
                    if (!isGroupExpanded) {
                      // Группа закрыта - показываем только первую задачу с блоком управления
                      return (
                        <MeetingCard
                          key={`${group.time}-header`}
                          task={group.tasks[0]}
                          isLast={isLastGroup}
                          showTime={showTime}
                          isGroupHeader={true}
                          groupCount={group.tasks.length}
                          isExpanded={false}
                          onToggleGroup={() => toggleGroup(group.time)}
                          taskType={taskType}
                        />
                      );
                    } else {
                      // Группа раскрыта - показываем все задачи
                      return group.tasks.map((task, indexInGroup) => (
                        <MeetingCard
                          key={task.id}
                          task={task}
                          isLast={
                            isLastGroup &&
                            indexInGroup === group.tasks.length - 1
                          }
                          showTime={showTime && indexInGroup === 0}
                          isGroupHeader={indexInGroup === 0}
                          groupCount={group.tasks.length}
                          isExpanded={true}
                          onToggleGroup={
                            indexInGroup === 0
                              ? () => toggleGroup(group.time)
                              : undefined
                          }
                          taskType={taskType}
                        />
                      ));
                    }
                  }
                })}
              </div>
            )}

            {/* Задачи без времени (простой список) */}
            {tasksWithoutTime.length > 0 && (
              <div className="mt-4">
                {tasksWithoutTime.map((task, index) => (
                  <MeetingCard
                    key={task.id}
                    task={task}
                    isLast={index === tasksWithoutTime.length - 1}
                    showTime={showTime}
                    showLeftLine={false}
                    taskType={taskType}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
