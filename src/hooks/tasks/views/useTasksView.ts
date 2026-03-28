import { useState } from 'react';

export type TaskView = 'list' | 'kanban' | 'calendar';
export type CalendarView = 'month' | 'week' | 'day';

export function useTasksView() {
  const [view, setView] = useState<TaskView>('list');
  const [calendarView, setCalendarView] = useState<CalendarView>('month');

  return {
    view,
    calendarView,
    setView,
    setCalendarView,
  };
}
