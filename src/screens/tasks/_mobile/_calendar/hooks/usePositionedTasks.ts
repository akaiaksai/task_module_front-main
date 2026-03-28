// usePositionedTasks.ts
import { calculateTaskPositions } from '@/shared/utils/calculateTaskPositions';
import { useMemo } from 'react';
import { Task } from '../../../../../shared/types/task';
import { PositionedTask } from '../types';

export const usePositionedTasks = ({
  filteredTasks,
  selectedDate,
  startHour,
  endHour,
  hourHeight,
  visibleHours,
  timeOffsetMinutes,
  containerWidth,
}: {
  filteredTasks: Task[];
  selectedDate: Date;
  startHour: number;
  endHour: number;
  hourHeight: number;
  visibleHours: number;
  timeOffsetMinutes: number;
  containerWidth: number;
}): PositionedTask[] => {
  const totalHeight = visibleHours * hourHeight;

  return useMemo(() => {
    const positioned = calculateTaskPositions(
      filteredTasks,
      selectedDate,
      startHour,
      endHour,
      hourHeight,
      visibleHours,
      timeOffsetMinutes,
      containerWidth
    );

    return positioned as PositionedTask[];
  }, [
    filteredTasks,
    selectedDate,
    startHour,
    endHour,
    hourHeight,
    visibleHours,
    timeOffsetMinutes,
    totalHeight,
  ]);
};
