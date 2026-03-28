import { useTasks } from '@/hooks/tasks/useTaskActions';
import { useAuthStore } from '@/store/auth';
import { useTaskFiltersStore } from '@/store/task-filters';
import { useUIStore } from '@/store/ui';
import { isSameDay, parseISO } from 'date-fns';
import { useEffect } from 'react';
import { MeetingCardHeader } from '../meetingCardHeader';

const MEETINGS_ID = 6;

export const Meets = () => {
  const { userId } = useAuthStore();
  const { meetingTasks, setMeetingTasks, setDayTasks } = useUIStore();
  const { data: tasksData } = useTasks(
    {},
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
      enabled: true,
      refetchOnMount: true,
      staleTime: 5 * 60 * 1000,
    }
  );

  const { selectedDate } = useTaskFiltersStore();

  useEffect(() => {
    if (!tasksData?.items) {
      return;
    }

    const todaysUserTasks = tasksData.items.filter((task) => {
      if (!task.dueDate) {
        return false;
      }

      const d = parseISO(task.dueDate);
      if (!isSameDay(d, selectedDate)) {
        return false;
      }

      const isAssignee = task.assigneeId === userId;
      const isAccomplice = task.accomplices?.includes(userId!) ?? false;

      return isAssignee || isAccomplice;
    });

    setDayTasks(todaysUserTasks);

    const todaysMeetings = todaysUserTasks.filter(
      (t) => t.groupId === MEETINGS_ID
    );

    setMeetingTasks(todaysMeetings);
  }, [tasksData?.items, selectedDate, setMeetingTasks, setDayTasks, userId]);

  if (!meetingTasks.length) {
    return (
      <p className="text-center text-gray-500">Нет встреч на выбранную дату</p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-2">
      {meetingTasks.map((task) => (
        <li key={task.id}>
          <MeetingCardHeader task={task} />
        </li>
      ))}
    </ul>
  );
};
