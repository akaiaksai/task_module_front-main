import { format, parseISO } from 'date-fns';
import { useRef } from 'react';
import { useTaskTapHandlers } from '../hooks/useTaskTapHandlers';
import { PositionedTask } from '../types';
import { getGroupColor, getTaskTypeColor } from '../utils/colors';
import { useTaskTimeStatus } from '../utils/useTaskTimeStatus';
import { SandClock } from '@/components/icons/sandClock';
import { StatusCircle } from '@/components/icons/statusCircle';
import { Pause } from '@/components/icons/pauseIcon';
import { useActiveTimerTask } from '@/hooks/tasks/useActiveTimerTask';
import { PlayIcon } from '@/components/icons/playIcon';
import { useTaskTimerStore } from '@/store/task-timer';
import { useTaskSelectionModalStore } from '@/store/task-selection-modal';

export interface TaskWithElapsedTimeProps {
  task: PositionedTask;
  activeTaskId: string | number | null;
  setActiveTaskId: (v: string | number | null) => void;
  handleTaskClick: (id: string) => void;
  useElapsedTimes?: (taskId: string) => ANY;
  groupView: boolean;
}

export const TaskWithElapsedTime = ({
  task,
  activeTaskId,
  setActiveTaskId,
  handleTaskClick,
  groupView,
}: TaskWithElapsedTimeProps) => {
  const isMulti = task.isMulti === true;
  const isActive = activeTaskId === task.id;

  const isTiny = task.height <= 40;
  const isHour = task.height > 40 && task.height <= 60;
  const isSmall = task.height <= 120;
  const isMeeting = task.groupId === 6;

  const { timeStatus, isLoading } = useTaskTimeStatus(task);
  const { isCompleted } = useActiveTimerTask();
  const { startTask, requestPause, getTask } = useTaskTimerStore();
  const openTaskSelectionModal = useTaskSelectionModalStore((s) => s.openModal);

  const timer = getTask(task.id);
  const isThisTaskRunning = !!timer?.isRunning;

  const isThisActiveTask = isActive;

  let taskColor: string;

  if (groupView && task.groupId !== undefined) {
    const groupColor = groupView ? getGroupColor(task.groupId) : null;

    if (groupColor) {
      taskColor = groupColor.border;
    } else {
      taskColor = getTaskTypeColor(task.type);
    }
  } else {
    taskColor = getTaskTypeColor(task.type);
    // textColor = getTextColor(taskColor);

    // Для негруппового вида используем тот же цвет для бордера, но немного темнее
    // const rgb = parseInt(taskColor.slice(1), 16);
    // const r = (rgb >> 16) & 0xff;
    // const g = (rgb >> 8) & 0xff;
    // const b = (rgb >> 0) & 0xff;
    // borderColor = `rgb(${Math.max(0, r - 30)}, ${Math.max(
    //   0,
    //   g - 30
    // )}, ${Math.max(0, b - 30)})`;
  }

  // Для неосновных задач в мульти-группах используем особые стили
  if (!task.isMain) {
    if (groupView && task.groupId !== undefined) {
      const groupColor = getGroupColor(task.groupId);
      taskColor = groupColor.border;
    } else {
      taskColor = getTaskTypeColor(task.type);
    }

    // textColor = getTextColor(taskColor);

    if (isMulti) {
      if (groupView) {
        const groupColor = getGroupColor(task.groupId);

        taskColor = groupColor.border;
        // textColor = groupColor.text;
      } else {
        taskColor = getTaskTypeColor(task.type);
        // textColor = getTextColor(taskColor);
      }
    } else if (!task.isMain) {
      const base = getTaskTypeColor(task.type);
      taskColor = base;
      // textColor = getTextColor(base);
      taskColor = `linear-gradient(${base}, ${base}), rgba(255,255,255,0.15)`;
    }
  }

  const titleRef = useRef<HTMLSpanElement>(null);

  const {
    onClick,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onPointerDownCapture,
  } = useTaskTapHandlers({
    taskId: task.id.toString(),
    isActive,
    setActiveTaskId,
    handleTaskClick,
  });

  const HORIZONTAL_PADDING = 6;
  const VERTICAL_PADDING = 1;

  const calculateZIndex = () => {
    const baseZIndex = (task.layer || 0) * 10;

    if (isActive) {
      const activeGroupBase = 50;

      if (isMulti) {
        return activeGroupBase + (task.isMain ? 3 : 2);
      } else {
        return activeGroupBase + 10;
      }
    }

    if (isMulti) {
      return baseZIndex + (task.isMain ? 2 : 1);
    } else {
      return baseZIndex + 1;
    }
  };

  return (
    <div
      className="absolute overflow-visible"
      style={{
        top: `${task.top - 50 + VERTICAL_PADDING + (isTiny ? 8 : 8)}px`,
        left: `calc(${task.left}% + 14px)`,
        width: `calc(${task.width}% - ${HORIZONTAL_PADDING * 2}px)`,
        height: `${task.height - VERTICAL_PADDING * 2}px`,
        zIndex: calculateZIndex(),
      }}
    >
      <div
        className="absolute inset-[2px] rounded-[4px] pointer-events-none"
        style={{
          boxShadow: `
            0 0 0 1px rgba(51, 193, 231, 0.4),
            0 0 5px rgba(51,193,231,0.6),
            0 0 10px rgba(51,193,231,0.35),
            0 0 20px rgba(51,193,231,0.2)
          `,
        }}
      />

      {/* КАРТОЧКА */}
      <div
        role="button"
        tabIndex={0}
        className="relative w-full h-full rounded-[4px] gap-1 pointer-events-auto text-left"
        onPointerDownCapture={onPointerDownCapture}
        style={{
          background: taskColor,
          border: '1px solid #8AE6FF80',
          color: 'white',
        }}
        onClick={onClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="absolute left-[4px] top-1 bottom-1 w-[1px] rounded-lg"
          style={{
            backgroundColor: 'white',
          }}
        />
        <div
          className={`h-full flex flex-col w-full overflow-y-auto ${
            isTiny ? 'p-2.5 pt-1' : 'p-3 pt-1'
          }`}
        >
          {(isTiny || isHour || isMulti) && (
            <div className="text-[12px] leading-[130%] tracking-[-0.5px] font-semibold break-word whitespace-normal">
              {task.title}
            </div>
          )}

          {!isTiny && !isHour && !isMulti && (
            <>
              {/* Заголовок со стилями сдачи */}
              <div className="text-[12px] mb-1 tracking-[-0.5px] font-semibold leading-[130%]">
                <span ref={titleRef} className="">
                  {task.title}
                </span>
              </div>

              {/* Блок с временной информацией */}
              {!isTiny &&
                !isSmall &&
                !isLoading &&
                timeStatus.display &&
                !isMeeting && (
                  <div className="space-y-[6px]">
                    <div className="w-full border-t opacity-30" />

                    <div className="text-[12px] font-normal leading-[130%] tracking-[-0.5px] flex gap-1">
                      <SandClock
                        stroke="white"
                        className="shrink-0 translate-y-[1px]"
                      />
                      <span>
                        {timeStatus.timeEstimateMin} мин –{' '}
                        {timeStatus.timeSpentMin} мин ={' '}
                        {timeStatus.remainingTimeByPlan} мин
                      </span>
                    </div>

                    <div className="w-full border-t opacity-30" />

                    <div className="text-[12px] font-normal tracking-[-0.5px] flex items-center gap-1 shrink-0">
                      <StatusCircle
                        width={16}
                        height={16}
                        color={timeStatus.statusColor!}
                      />
                      {timeStatus.status}
                    </div>
                  </div>
                )}

              {/* Дата сдачи теперь внизу после всей информации */}
              {!isMeeting && (
                <div className="text-[12px] mt-[6px] font-normal leading-[130%] tracking-[-0.5px] text-right">
                  Сдача {format(parseISO(task.dueDate!), 'dd.MM.yy HH:mm')}
                </div>
              )}

              {!isMeeting && !isTiny && !isHour && (
                <div
                  className="mt-[6px] flex flex-wrap gap-2 items-center pointer-events-auto"
                  style={{
                    justifyContent: 'space-between',
                  }}
                >
                  <button
                    data-card-action
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isThisActiveTask || isCompleted) {
                        return;
                      }

                      openTaskSelectionModal({
                        mode: 'complete',
                        taskId: task.id.toString(),
                      });
                    }}
                    disabled={!isThisActiveTask || isCompleted}
                    className="
                     min-w-0
                          px-[23px]
                          py-[8.5px]
                          rounded-full
                          border
                          border-white
                          text-[12px]
                          font-semibold
                          leading-[130%]
                          tracking-[-0.5px]
                        "
                    style={{
                      paddingLeft: 'clamp(15px, 3vw, 23px)',
                      paddingRight: 'clamp(15px, 3vw, 23px)',
                      paddingTop: 'clamp(6px, 1.2vw, 8.5px)',
                      paddingBottom: 'clamp(6px, 1.2vw, 8.5px)',
                      fontSize: 'clamp(10px, 1.2vw, 12px)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    Завершить
                  </button>

                  <button
                    data-card-action
                    className="shrink-0 ml-auto"
                    onClick={(e) => {
                      e.stopPropagation();

                      if (isCompleted) {
                        return;
                      }

                      if (!isThisActiveTask) {
                        startTask(task.id.toString());
                        return;
                      }

                      const timer = getTask(task.id.toString());
                      if (timer?.isRunning) {
                        requestPause(task.id.toString());
                      } else {
                        startTask(task.id.toString());
                      }
                    }}
                  >
                    {isThisTaskRunning ? <Pause /> : <PlayIcon />}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div
          className="absolute inset-0  rounded-lg"
          style={{
            display:
              activeTaskId && activeTaskId !== task.id ? 'block' : 'none',
            pointerEvents: 'none',
            backgroundColor: taskColor,
            opacity: 0.5,
          }}
        />
      </div>
    </div>
  );
};
