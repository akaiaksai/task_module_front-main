import { format } from 'date-fns';
import { memo, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DayGrid } from './grids/DayGrid';
import { MonthGrid } from './grids/MonthGrid';
import { WeekGrid } from './grids/WeekGrid';
import { Task } from '@/shared/types/task';
import { useTaskTimerStore } from '@/store/task-timer';

type Props = {
  tasks: Task[];
  anchorDate: Date;
  mode: 'month' | 'week' | 'day';
  loading?: boolean;
};

// Оптимизированный CalendarView с мемоизацией и улучшенным адаптивом
const CalendarView = memo(({ tasks, anchorDate, mode, loading }: Props) => {
  const [sp, setSp] = useSearchParams();

  const { startTask, pauseTask, activeTaskId } = useTaskTimerStore();

  const handleStartTask = (id: string) => startTask(id);
  const handlePauseTask = (id: string) => pauseTask(id);

  const handleFinishTask = (id: string) => {
    const next = new URLSearchParams(sp);
    next.set('m', 'complete');
    next.set('id', id);
    setSp(next, { replace: true });
  };

  const isTaskRunning = (id: string) => activeTaskId === id;

  const openTaskModal = useCallback(
    (id: string) => {
      const next = new URLSearchParams(sp);
      next.set('m', 'task');
      next.set('id', id);
      setSp(next, { replace: true });
    },
    [sp, setSp]
  );

  const openDayModal = useCallback(
    (day: Date) => {
      const next = new URLSearchParams(sp);
      next.set('m', 'day');
      next.set('date', format(day, 'yyyy-MM-dd'));
      setSp(next, { replace: true });
    },
    [sp, setSp]
  );

  const calendarGrid = useMemo(() => {
    switch (mode) {
      case 'month':
        return (
          <MonthGrid
            tasks={tasks}
            anchorDate={anchorDate}
            loading={loading}
            onOpenDay={openDayModal}
            onOpenTask={openTaskModal}
          />
        );
      case 'week':
        return (
          <WeekGrid
            tasks={tasks}
            anchorDate={anchorDate}
            loading={loading}
            onOpenDay={openDayModal}
            onOpenTask={openTaskModal}
          />
        );
      case 'day':
        return (
          <DayGrid
            tasks={tasks}
            anchorDate={anchorDate}
            loading={loading}
            onOpenTask={openTaskModal}
            isTaskRunning={isTaskRunning}
            handleStartTask={handleStartTask}
            handlePauseTask={handlePauseTask}
            handleFinishTask={handleFinishTask}
          />
        );
      default:
        return null;
    }
  }, [mode, tasks, anchorDate, loading, openDayModal, openTaskModal]);

  return (
    <div className="space-y-4">
      <div>{calendarGrid}</div>
    </div>
  );
});

CalendarView.displayName = 'CalendarView';

export default CalendarView;
