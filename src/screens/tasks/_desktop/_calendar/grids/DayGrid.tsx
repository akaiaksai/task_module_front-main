import { SandClock } from '@/components/icons/sandClock';
import { StatusCircle } from '@/components/icons/statusCircle';
import { getGroupColor } from '@/screens/tasks/_mobile/_calendar/utils/colors';
import { useTaskTimeStatus } from '@/screens/tasks/_mobile/_calendar/utils/useTaskTimeStatus';
import { Task } from '@/shared/types/task';
import { useAuthStore } from '@/store/auth';
import Skeleton from '@/ui/Skeleton';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CheckCircle, Pause, Play } from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { usePositionedTasksForDayGrid } from '../hooks/usePositionedTasksForDayGrid';

interface DayGridTaskCardProps {
  task: Task;
  position: {
    top: string;
    height: string;
  };
  layout: {
    column: number;
    totalColumns: number;
    width: number;
    left: number;
  };

  isActive: boolean;
  setActiveTaskId: (id: string | null) => void;

  onOpenTask: (id: string) => void;
  isTaskRunning: (id: string) => boolean;
  handleStartTask: (id: string) => void;
  handlePauseTask: (id: string) => void;
  handleFinishTask: (id: string) => void;
}

function DayGridTaskCard({
  task,
  position,
  layout,
  onOpenTask,
  isActive,
  setActiveTaskId,
  isTaskRunning,
  handleStartTask,
  handlePauseTask,
  handleFinishTask,
}: DayGridTaskCardProps) {
  const { timeStatus, isLoading } = useTaskTimeStatus(task);
  const running = isTaskRunning(task.id);
  const groupColor = getGroupColor(task.groupId);
  const zIndex = isActive ? 1000 : 10;
  const isSmallTask = parseFloat(position.height) <= 7;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isActive) {
      setActiveTaskId(task.id);
      return;
    }

    onOpenTask(task.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Открыть задачу ${task.title}`}
      className={`absolute transition-all cursor-pointer shadow-sm rounded-[10px] pointer-events-auto border ${isActive && 'ring-2 ring-black/20 scale-[0.99]'}`}
      style={{
        top: `calc(${position.top} + 3px)`,
        height: `calc(${position.height} - 4px)`,
        left: `calc(${layout.left}% + 3px)`,
        width: `calc(${layout.width}% - 10px)`,
        zIndex,
        backgroundColor: groupColor.bg,
      }}
      onClick={handleClick}
    >
      <div
        className={`flex flex-col h-full text-[#2A2D61] ${
          isSmallTask
            ? 'overflow-hidden px-[9px] py-[2px]'
            : 'overflow-y-auto px-[9px] py-[8px]'
        }`}
      >
        {isSmallTask ? (
          <div className="text-[9px]" style={{ color: groupColor.text }}>
            {task.title}
          </div>
        ) : (
          <>
            <div
              className="text-[12px] font-semibold text-start mb-[4px]"
              style={{ color: groupColor.text }}
            >
              {task.dueDate
                ? `Сдача ${format(parseISO(task.dueDate), 'dd.MM.yy - HH:mm')}`
                : 'Без срока'}
            </div>

            <div className="text-[10px] leading-[130%] line-clamp-2 mb-[6px] text-start">
              {task.title}
            </div>

            <div className="h-[1px] w-[50%] bg-[#00000020] mb-[6px]" />

            {!isLoading && timeStatus.display && (
              <div className="flex items-center gap-[6px] text-[10px] mb-[6px]">
                <SandClock />
                <span>
                  {timeStatus.timeEstimateMin} мин – {timeStatus.timeSpentMin}{' '}
                  мин = <span>{timeStatus.remainingTimeByPlan} мин</span>
                </span>
              </div>
            )}

            <div className="h-[1px] w-[50%] bg-[#00000020] mb-[6px]" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px]">
                <StatusCircle color={timeStatus.statusColor!} />
                <span>{timeStatus.status}</span>
              </div>

              <div className="flex items-center gap-1">
                {!running ? (
                  <button
                    className="p-[4px] rounded hover:bg-blue-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartTask(task.id);
                    }}
                  >
                    <Play className="w-3 h-3 text-blue-600" />
                  </button>
                ) : (
                  <button
                    className="p-[4px] rounded hover:bg-yellow-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePauseTask(task.id);
                    }}
                  >
                    <Pause className="w-3 h-3 text-yellow-600" />
                  </button>
                )}

                <button
                  className="p-[4px] rounded hover:bg-red-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFinishTask(task.id);
                  }}
                >
                  <CheckCircle className="w-3 h-3 text-red-600" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface DayProps {
  tasks: Task[];
  anchorDate: Date;
  loading?: boolean;
  onOpenTask: (id: string) => void;

  isTaskRunning: (id: string) => boolean;
  handleStartTask: (id: string) => void;
  handlePauseTask: (id: string) => void;
  handleFinishTask: (id: string) => void;
}

export const DayGrid = memo(
  ({
    tasks,
    anchorDate,
    loading,
    onOpenTask,
    isTaskRunning,
    handleStartTask,
    handlePauseTask,
    handleFinishTask,
  }: DayProps) => {
    const { userId } = useAuthStore();

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

    useEffect(() => {
      if (!containerRef.current) {
        return;
      }

      const observer = new ResizeObserver(([entry]) => {
        setContainerWidth(entry.contentRect.width);
      });

      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }, []);

    const myTasks = useMemo(
      () => (userId ? tasks.filter((t) => t.assigneeId === userId) : []),
      [tasks, userId]
    );

    const hours = useMemo(() => {
      return Array.from({ length: 16 }, (_, i) => {
        const h = new Date(anchorDate);
        h.setHours(i + 8, 0, 0, 0);
        return h;
      });
    }, [anchorDate]);

    const positionedTasks = usePositionedTasksForDayGrid(
      myTasks,
      anchorDate,
      containerWidth
    );

    return (
      <div className="bg-white rounded-[14px] border border-[#0000001A] overflow-hidden shadow-soft">
        <div className="overflow-auto">
          <div
            className="grid min-w-[400px] relative"
            style={{ gridTemplateColumns: '80px 1fr' }}
          >
            <div className="col-span-2 text-center py-[11.5px] text-[12px] leading-[130%] font-normal tracking-[-0.5px] min-h-[39px]">
              {format(anchorDate, 'EEEE d', { locale: ru })}
            </div>

            <div className="col-span-2 relative">
              <div className="grid" style={{ gridTemplateColumns: '71px 1fr' }}>
                {hours.map((h, i) => (
                  <div key={i} className="contents">
                    <div className="relative border-t border-r border-gray-100 h-[37px] w-[71px]">
                      {i > 0 && (
                        <span className="absolute left-[20px] -top-[8px] text-[12px] text-[#00000080]">
                          {format(h, 'HH:00')}
                        </span>
                      )}
                    </div>
                    <div className="border-t border-gray-100 h-[37px] relative">
                      {loading && i === 0 && (
                        <div className="p-2">
                          <Skeleton className="h-4 w-32" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="absolute inset-0 pointer-events-auto"
                onClick={() => setActiveTaskId(null)}
                style={{ marginLeft: '71px' }}
              >
                <div className="h-full w-full relative" ref={containerRef}>
                  {!loading &&
                    positionedTasks.map((task) => (
                      <DayGridTaskCard
                        key={task.id}
                        task={task}
                        position={{
                          top: task.top,
                          height: task.height,
                        }}
                        layout={{
                          left: task.left,
                          width: task.width,
                          column: 0,
                          totalColumns: 1,
                        }}
                        onOpenTask={onOpenTask}
                        isActive={activeTaskId === task.id}
                        setActiveTaskId={setActiveTaskId}
                        isTaskRunning={isTaskRunning}
                        handleStartTask={handleStartTask}
                        handlePauseTask={handlePauseTask}
                        handleFinishTask={handleFinishTask}
                      />
                    ))}
                </div>
              </div>
            </div>
            {activeTaskId && (
              <div
                className="absolute inset-0 z-[20]"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.15)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
);

DayGrid.displayName = 'DayGrid';
