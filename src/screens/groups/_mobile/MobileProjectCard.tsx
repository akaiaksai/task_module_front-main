import { getPriorityColor, getTimeColor } from '@/shared/utils/helpers';
import { ChevronUp } from 'lucide-react';

interface Props {
  title: string;
  priority: number;
  totalHours: number;
  startDate: string;
  endDate: string;
  freeNow: string;
  week2: string;
  week3: string;
  isOpen: boolean;
  color: string;

  onToggle: () => void;
  onOpen?: () => void;
}

export function MobileProjectCardExpanded({
  title,
  priority,
  totalHours,
  startDate,
  endDate,
  freeNow,
  week2,
  week3,
  isOpen,
  onToggle,
  color,
}: Props) {
  const priorityColor = getPriorityColor(priority);
  const totalTimeColor = getTimeColor(totalHours);
  return (
    <div
      className={`w-full bg-white rounded-[10px] overflow-hidden shadow-lg border`}
      style={{ borderColor: color }}
    >
      <div
        className="px-3 pt-[12px] pb-[6px] text-white text-[18px] leading-[130%] font-normal tracking-[-0.5px] line-clamp-1"
        style={{ backgroundColor: color }}
      >
        {title}
      </div>

      <div className="px-3 py-3 text-[14px] leading-[130%] font-normal text-black">
        <div className="grid grid-cols-2 gap-x-6 gap-y-[10px] mb-4">
          <Item color={priorityColor} text={`Приоритет ${priority}/10`} />
          <Item
            color="bg-[#53C41A]"
            text={`Начало ${startDate ? startDate : '—'}`}
          />

          <Item color={totalTimeColor} text={`Общее время ${totalHours} ч`} />
          <Item
            color="bg-[#53C41A]"
            text={`Сдача ${endDate ? endDate : '—'}`}
          />
        </div>

        <div className="flex items-center gap-[10px] text-[12px] font-normal leading-[130%] tracking-[-0.83px] mb-3">
          <div className="text-black shrink-0">Свободно:</div>

          <div className="grid grid-cols-3 gap-[10px] text-right">
            <div className="text-start">
              <div className="text-black">Текущая неделя</div>
              <div className="">{freeNow}</div>
            </div>

            <div className="text-start">
              <div className="text-black">Вторая неделя</div>
              <div className="">{week2}</div>
            </div>

            <div className="text-start">
              <div className="text-black">Третья неделя</div>
              <div className="">{week3}</div>
            </div>
          </div>
        </div>

        <div className="h-px bg-[#00000052] mb-3" />

        <div className="flex justify-center">
          <button
            onClick={onToggle}
            className="
                flex items-center gap-2
                px-[10px] py-[6px]
                rounded-[24px]
                text-[11px]
                leading-[130%]
                tracking-[-0.83px]
                font-normal
                active:scale-95
                "
            style={{
              backgroundColor: `${color}1f`,
              color,
            }}
          >
            {isOpen ? 'Закрыть' : 'Открыть'}
            <ChevronUp
              size={13}
              className={`transition-transform ${isOpen ? '' : 'rotate-180'}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function Item({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-center gap-[10px]">
      <span className={`w-[9px] h-[9px] rounded-full shrink-0 ${color}`} />
      <span className="text-[14px] leading-[130%] tracking-[-0.83px] font-normal">
        {text}
      </span>
    </div>
  );
}
