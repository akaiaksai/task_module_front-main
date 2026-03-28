import { SandClock } from '@/components/icons/sandClock';
import { ModuleTask } from '@/hooks/groups/useProjectsModule';

export default function TaskCard({ task }: { task: ModuleTask }) {
  const hours = task.TIME_ESTIMATE / 3600;
  const displayHours = Number.isInteger(hours) ? hours : hours.toFixed(1);

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="text-[8px] font-normal leading-[130%] mb-1 tracking-[-0.5px]">
        {task.TITLE}
      </div>

      <div className="h-[1px] bg-white/20 w-full mt-1 shrink-0" />

      <div className="text-[10px] font-medium text-[#C0BDFF] flex items-center gap-1 mt-1">
        <SandClock stroke={'#C0BDFF'} /> {displayHours} часов
      </div>

      <div className="h-[1px] bg-white/20 w-full mt-1 shrink-0" />

      <div className="flex flex-col gap-1 mt-2">
        <div className="text-[8px] font-normal leading-[130%]">Навыки</div>

        {(task.Skills ?? []).map((s, i) => (
          <div
            key={i}
            className="flex font-normal gap-1 text-[8px] leading-[130%]"
          >
            ✓ <span>{s}</span>
          </div>
        ))}
      </div>

      <div className="h-[0.5px] bg-white/20 w-full mt-1 shrink-0" />

      <div className="flex flex-col gap-1 mt-2">
        <div className="text-[8px] font-normal leading-[130%]">Знание</div>

        {task.Knowledge && (
          <div className="flex font-normal gap-1 text-[8px] leading-[130%]">
            ✓ <span>{task.Knowledge}</span>
          </div>
        )}
      </div>
    </div>
  );
}
