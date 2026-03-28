// MobileCalendar.tsx
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { CurrentTimeLine } from './components/CurrentTimeLine';
import { TaskWithElapsedTime } from './components/TaskWithElapsedTime';
import { TimeGrid } from './components/TimeGrid';
import { useFilteredTasks } from './hooks/useFilteredTasks';
import { usePositionedTasks } from './hooks/usePositionedTasks';

import { Task } from '@/shared/types/task';
import { TIME_COLUMN_WIDTH } from './utils/constants';

export interface MobileCalendarProps {
  tasks?: Task[];
  startHour?: number;
  endHour?: number;
  hourHeight?: number;
  backgroundColor?: string;
  lineColor?: string;
  currentTimeColor?: string;
  selectedDate?: Date;
  groupView?: boolean;
  useElapsedTimes?: (taskId: string) => ANY;
  userId?: number | null;
  isAdmin?: boolean;
  calendarType?: 'default' | 'meetings';
  timeOffsetMinutes?: number;
}

const MobileCalendar = ({
  tasks = [],
  startHour = 9,
  endHour = 24,
  hourHeight = 50,
  backgroundColor,
  lineColor = '#000000',
  currentTimeColor = '#E77B7BCC',
  selectedDate = new Date(),
  groupView = false,
  useElapsedTimes,
  userId = null,
  isAdmin = false,
  calendarType = 'default',
  timeOffsetMinutes = 0,
}: MobileCalendarProps) => {
  const [visibleHours] = useState(endHour - startHour);
  const [activeTaskId, setActiveTaskId] = useState<string | number | null>(
    null
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const containerWidth = containerRef.current?.offsetWidth ?? window.innerWidth;

  const navigate = useNavigate();

  const handleTaskClick = (id: string) => {
    window.scrollTo({ top: 0, left: 0 });
    navigate(`/tasks/${id}`);
  };

  const filteredTasks = useFilteredTasks(tasks, userId, isAdmin, calendarType);

  const positionedTasks = usePositionedTasks({
    filteredTasks,
    selectedDate,
    startHour,
    endHour,
    hourHeight,
    visibleHours,
    timeOffsetMinutes,
    containerWidth,
  });

  const totalHeight = visibleHours * hourHeight;

  return (
    <div
      className="w-full h-full flex flex-col relative"
      style={{ backgroundColor }}
    >
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'auto',
        }}
      >
        <div
          className="pl-3 mb-4"
          style={{
            height: `${totalHeight}px`,
            width: '100%',
            position: 'relative',
            minWidth: '100%',
            pointerEvents: 'none',
          }}
        >
          <TimeGrid
            hours={Array.from(
              { length: visibleHours },
              (_, i) => i + startHour
            )}
            hourHeight={hourHeight}
            backgroundColor={backgroundColor}
            lineColor={lineColor}
          />

          <CurrentTimeLine
            startHour={startHour}
            hourHeight={hourHeight}
            totalHeight={totalHeight}
            currentTimeColor={currentTimeColor}
          />

          <div
            className="absolute inset-0"
            style={{ pointerEvents: 'auto', zIndex: 0 }}
            onClick={() => setActiveTaskId(null)}
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{ left: TIME_COLUMN_WIDTH }}
          >
            {positionedTasks.map((task) => (
              <TaskWithElapsedTime
                key={task.id}
                task={task}
                activeTaskId={activeTaskId}
                setActiveTaskId={setActiveTaskId}
                handleTaskClick={handleTaskClick}
                useElapsedTimes={useElapsedTimes}
                groupView={groupView}
              />
            ))}
          </div>

          {positionedTasks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-black pointer-events-none">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">
                  Нет задач на этот день
                </div>
                <div className="text-sm opacity-80">
                  {filteredTasks.length === 0
                    ? 'Задачи не найдены'
                    : 'Задачи не попадают в выбранный временной диапазон'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileCalendar;
