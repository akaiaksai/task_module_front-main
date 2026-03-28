// import { Check, Clock } from 'lucide-react';
import { WindowCard } from '@components/dumb/WindowCard';

interface CommunicationBlockProps {
  onClose: () => void;
  lastMessage?: string | null;
  resume?: string | null;
}

export function CommunicationBlock({
  onClose,
  lastMessage,
  resume,
}: CommunicationBlockProps) {
  const getValue = (val: ANY) => {
    if (!val) {
      return null;
    }
    if (typeof val === 'string') {
      return val;
    }
    if (val.Valid) {
      return val.String ?? null;
    }
    return null;
  };

  const last = getValue(lastMessage);
  const summary = getValue(resume);

  return (
    <WindowCard
      titleClassName="text-white"
      title="История коммуникаций с клиентом"
      onClose={onClose}
    >
      <div className="flex flex-col gap-6">
        {last && (
          <div className="p-2">
            <h3 className="text-[16px] font-medium leading-[130%] text-[#2B2B2B] mb-3">
              Последнее сообщение
            </h3>

            <div className="rounded-xl border border-[#2B2B2B1F] p-3 text-[14px] font-normal leading-[130%] text-[#2B2B2B]">
              {last}
            </div>

            {/* <div className="flex items-center justify-between mt-3">
              <div className="text-[14px] font-normal leading-[130%] text-[#2B2B2B73]">
                14.10.2025 / 20:55
              </div>

              <div className="flex items-center gap-2 text-[12px] leading-[130%] text-[#E5B702] font-medium">
                <Clock className="w-3 h-3 text-[#E5B702] translate-y-[-1.5px]" />
                Ожидает ответа
              </div>
            </div> */}
          </div>
        )}

        {summary && (
          <div className="p-2">
            <h3 className="text-[16px] font-medium leading-[130%] text-[#2B2B2B] mb-3">
              Резюме последнего разговора
            </h3>

            <div className="rounded-xl border border-[#2B2B2B1F] p-3 text-[14px] leading-[130%] text-[#2B2B2B]">
              {summary}
            </div>

            {/* <div className="flex items-center justify-between mt-3">
              <div className="mt-3 text-[14px] text-[#2B2B2B73]">
                12.10.2025 / 20:55
              </div>

              <div className="flex items-center gap-2 text-[12px] leading-[130%] text-[#53C41A] font-medium">
                <Check className="w-3 h-3 text-[#53C41A]" />
                Задача завершена
              </div>
            </div> */}
          </div>
        )}
      </div>
    </WindowCard>
  );
}
