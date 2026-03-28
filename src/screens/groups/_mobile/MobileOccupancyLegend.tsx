import { getPeriodNorm } from '@/utils/time';

type ViewMode = 'week' | 'month' | 'day';

export function MobileOccupancyLegend({ viewMode }: { viewMode: ViewMode }) {
  return (
    <div className="my-[32px] flex justify-center border rounded-[25px] border-[#00000052]">
      <div
        className="
          inline-flex items-center
          bg-white px-4 py-[10px]
          rounded-[25px]
          shadow-md
          w-full
          font-normal
          text-[12px] leading-[130%] tracking-[-0.5px]
          flex-wrap
        "
      >
        <span className="shrink-0">
          Занятость (норма {getPeriodNorm(viewMode)}ч)
        </span>

        <div className="flex items-center gap-[7px] shrink-0 ml-[14px]">
          <Legend color="#53C41A" label="<60%" />
          <Legend color="#E5B702" label="<60–90%" />
          <Legend color="#E57002" label="<90–110%" />
          <Legend color="#EF4642" label=">110%" />
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-[4.5px] shrink-0">
      <span
        className="w-[7px] h-[7px] rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}
