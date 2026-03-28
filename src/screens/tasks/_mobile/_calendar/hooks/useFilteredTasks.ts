import { Task } from '@/shared/types/task';
import { useMemo } from 'react';

export const useFilteredTasks = (
  tasks: Task[],
  userId: number | null,
  isAdmin: boolean,
  calendarType: 'default' | 'meetings'
) => {
  return useMemo(() => {
    return tasks.filter((task) => {
      const isMeeting = task.groupId === 6;

      if (calendarType === 'meetings') {
        if (
          !isMeeting ||
          (task.assigneeId !== userId &&
            !task.accomplices?.includes(userId as number))
        ) {
          return false;
        }
      } else {
        if (isMeeting) {
          return false;
        }
      }

      if (!isAdmin && userId) {
        return task.assigneeId === userId;
      }

      return true;
    });
  }, [tasks, userId, isAdmin, calendarType]);
};
