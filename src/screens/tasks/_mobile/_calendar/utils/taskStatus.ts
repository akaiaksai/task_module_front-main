import { Task } from '@/shared/types/task';
import { parseISO } from 'date-fns';

export const getTaskTimeStatus = (task: Task, elapsedSeconds = 0) => {
  if (!task.dueDate || !task.timeEstimate) {
    return { display: false };
  }

  const now = new Date();
  const due = parseISO(task.dueDate);

  const est = Math.round(task.timeEstimate / 60);
  const spent = Math.round(elapsedSeconds / 60);
  const remain = Math.max(0, est - spent);

  const timeToDeadline = (due.getTime() - now.getTime()) / 60000;

  if (timeToDeadline < 0) {
    return {
      display: true,
      timeEstimateMin: est,
      timeSpentMin: spent,
      remainingTimeByPlan: remain,
      status: 'Просрочено',
      statusColor: '#EF4642',
    };
  }

  if (remain > timeToDeadline) {
    return {
      display: true,
      timeEstimateMin: est,
      timeSpentMin: spent,
      remainingTimeByPlan: remain,
      status: 'Критично',
      statusColor: '#EF4642',
    };
  }

  if (remain > timeToDeadline * 0.7) {
    return {
      display: true,
      timeEstimateMin: est,
      timeSpentMin: spent,
      remainingTimeByPlan: remain,
      status: 'Могу не успеть',
      statusColor: '#E5B702',
    };
  }

  return {
    display: true,
    timeEstimateMin: est,
    timeSpentMin: spent,
    remainingTimeByPlan: remain,
    status: 'Все по плану',
    statusColor: '#21C564',
  };
};
