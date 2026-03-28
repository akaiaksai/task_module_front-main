import { format, parseISO } from 'date-fns';

import { SandClock } from '@/components/icons/sandClock';
import { StatusCircle } from '@/components/icons/statusCircle';
import { useRef } from 'react';
import { getGroupColor } from '../../_mobile/_calendar/utils/colors';
import { useTaskTimeStatus } from '../../_mobile/_calendar/utils/useTaskTimeStatus';
import { Task } from '@/shared/types/task';
import { CheckCircle, Pause, Play } from 'lucide-react';

interface Props {
  task: Task;
  openTaskModal: (id: string) => void;
  handleDragStart: (task: Task) => void;

  handleStartTask: (id: string) => void;
  handlePauseTask: (id: string) => void;
  handleFinishTask: (id: string) => void;
  isTaskRunning: (id: string) => boolean;
}

export function KanbanTaskCard({
  task,
  openTaskModal,
  handleDragStart,

  handleStartTask,
  handlePauseTask,
  handleFinishTask,
  isTaskRunning,
}: Props) {
  const groupColor = getGroupColor(task.groupId);
  const cardRef = useRef<HTMLDivElement>(null);

  const running = isTaskRunning(task.id);

  const onDragStart = (e: React.DragEvent) => {
    handleDragStart(task);

    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();

      const clone = cardRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '-9999px';
      clone.style.pointerEvents = 'none';

      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;

      clone.style.borderRadius = getComputedStyle(cardRef.current).borderRadius;
      clone.style.overflow = 'hidden';

      document.body.appendChild(clone);

      e.dataTransfer.setDragImage(clone, rect.width / 2, rect.height / 2);

      setTimeout(() => {
        document.body.removeChild(clone);
      }, 0);
    }
  };

  const { timeStatus, isLoading } = useTaskTimeStatus(task);

  return (
    <div
      draggable
      ref={cardRef}
      onDragStart={onDragStart}
      onClick={() => openTaskModal(task.id)}
      style={{
        backgroundColor: groupColor.bg,
        borderColor: groupColor.border,
      }}
      className="
        w-full text-left rounded-2xl pt-[10px] pb-[7px] px-[9px]
        transition cursor-grab active:cursor-grabbing
      "
    >
      <div
        style={{ color: groupColor.text }}
        className="text-[12px] font-semibold leading-[130%] truncate"
      >
        {task.dueDate
          ? `Сдача ${format(parseISO(task.dueDate), 'dd.MM.yy - HH:mm')}`
          : 'Без срока'}
      </div>

      <div className="text-[10px] font-normal leading-[130%] text-[#2A2D61] line-clamp-2 max-w-[130px] my-[6px]">
        {task.title}
      </div>

      {!isLoading && timeStatus.display && (
        <>
          <div className="h-[1px] bg-neutral-300/40 w-[80%]" />

          <div className="flex gap-1 items-center text-[10px] leading-[130%] text-[#2A2D61] font-normal my-[6px]">
            <SandClock />

            <span>
              {timeStatus.timeEstimateMin} мин - {timeStatus.timeSpentMin} мин ={' '}
              {timeStatus.remainingTimeByPlan} мин
            </span>
          </div>

          <div className="h-[1px] bg-neutral-300/40 w-[80%] mb-[6px]" />

          <div className="flex items-center justify-between text-[10px] text-[#2A2D61]">
            <div className="flex items-center gap-1">
              <StatusCircle color={timeStatus.statusColor!} />

              <span className={`text-[#2A2D61]`}>{timeStatus.status}</span>
            </div>
            <div className="flex items-center gap-1">
              {!running ? (
                <button
                  className="p-1 rounded hover:bg-blue-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartTask(task.id);
                  }}
                >
                  <Play className="w-3 h-3 text-blue-600" />
                </button>
              ) : (
                <button
                  className="p-1 rounded hover:bg-yellow-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePauseTask(task.id);
                  }}
                >
                  <Pause className="w-3 h-3 text-yellow-600" />
                </button>
              )}

              <button
                className="p-1 rounded hover:bg-red-100"
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
  );
}
