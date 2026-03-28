import { useMemo } from 'react';
import { Task } from '@/shared/types/task';
import { calculateTaskPositions } from '@/shared/utils/calculateTaskPositions';

export interface DesktopPositionedTask extends Task {
  top: string;
  height: string;
  left: number;
  width: number;
  zIndex?: number;
}

export function usePositionedTasksForDayGrid(
  tasks: Task[],
  anchorDate: Date,
  containerWidth: number
): DesktopPositionedTask[] {
  return useMemo(() => {
    const START_HOUR = 8;
    const END_HOUR = 24;
    const VISIBLE_HOURS = END_HOUR - START_HOUR;

    const HOUR_HEIGHT = 100;
    const TOTAL_HEIGHT = VISIBLE_HOURS * HOUR_HEIGHT;

    const positioned = calculateTaskPositions(
      tasks,
      anchorDate,
      START_HOUR,
      END_HOUR,
      HOUR_HEIGHT,
      VISIBLE_HOURS,
      0,
      containerWidth
    );

    return positioned.map((t) => ({
      ...t,
      top: `${(t.top / TOTAL_HEIGHT) * 100}%`,
      height: `${(t.height / TOTAL_HEIGHT) * 100}%`,
      left: t.left,
      width: t.width,
      zIndex: t.zIndex,
    }));
  }, [tasks, anchorDate]);
}
