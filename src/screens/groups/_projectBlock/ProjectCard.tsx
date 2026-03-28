import { getProjectColorById } from '@/screens/tasks/_mobile/_calendar/utils/projectColors';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProjectCard({
  p,
  onOpen,
  onClose,
  isOpen,
  className = `rounded-[14px] border-black`,
}: ANY) {
  const projectColor = getProjectColorById(p.id);

  const headerColor = {
    bg: projectColor + '22',
    border: projectColor,
    text: '#FFFFFF',
  };

  function getPriorityColor(priority: number) {
    if (priority <= 4) {
      return 'bg-[#53C41A]';
    }
    if (priority <= 7) {
      return 'bg-[#E5B702]';
    }
    return 'bg-[#EF4642]';
  }

  function getTimeColor(totalHours: number) {
    if (totalHours <= 20) {
      return 'bg-[#53C41A]';
    }
    if (totalHours <= 60) {
      return 'bg-[#E5B702]';
    }
    return 'bg-[#EF4642]';
  }

  return (
    <div
      className={`${className} border-[0.5px] overflow-hidden flex flex-col`}
      style={{ width: '183px' }}
    >
      <div
        className="w-full py-[15px] px-6 text-white text-[18px] leading-[130%] tracking-[-0.83px] font-normal"
        style={{ backgroundColor: headerColor.border }}
      >
        <div
          className="truncate overflow-hidden"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {p.title}
        </div>
      </div>

      <div className="w-full px-6 pt-[23px] pb-[7px] flex flex-col gap-[10px] text-[14px] tracking-[-0.83px] leading-[130%] bg-white text-black">
        <div className="flex flex-col gap-[10px]">
          <div className="flex items-center gap-2">
            <div
              className={`w-[9px] h-[9px] rounded-full  ${getPriorityColor(
                p.priority
              )}`}
            />
            <span className="font-normal">Приоритет {p.priority}/10</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-[9px] h-[9px] font-normal rounded-full bg-[#53C41A]" />
            <span>Начало {p.start ? p.start : '—'}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-[9px] h-[9px] font-normal rounded-full bg-[#53C41A]" />
            <span>Сдача {p.end ? p.end : '—'}</span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-[9px] h-[9px] rounded-full shrink-0 ${getTimeColor(Number(p.total))}`}
            />
            <span className="whitespace-nowrap">Общее время {p.total}</span>
          </div>
        </div>

        <div className="flex flex-col gap-[10px] mx-[17px] font-normal text-black text-[10px] text-nowrap leading-[130%] tracking-[-0.83px]">
          <span>Свободно:</span>

          <div className="grid grid-cols-[auto_1fr] gap-y-[10px] gap-x-[15px]">
            <div>Текущая неделя</div>
            <div className="text-right">{p.free[0]}</div>

            <div>Вторая неделя</div>
            <div className="text-right">{p.free[1]}</div>

            <div>Третья неделя</div>
            <div className="text-right">{p.free[2]}</div>
          </div>
        </div>

        <button
          onClick={isOpen ? onClose : onOpen}
          className="mt-[13px] mx-auto py-[5px] px-2 rounded-[24px] text-center font-normal text-[10px] tracking-[-0.83px] flex items-center justify-center w-[86px] leading-none h-[23px]"
          style={{
            backgroundColor: `${headerColor.border}8f`,
            color: headerColor.text,
          }}
        >
          {isOpen ? (
            <div className="gap-x-[4px] flex items-center">
              <span>Закрыть</span>
              <ChevronLeft width={12} height={12} />
            </div>
          ) : (
            <div className="gap-x-[4px] flex items-center">
              <span>Открыть </span>
              <ChevronRight width={12} height={12} />
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
