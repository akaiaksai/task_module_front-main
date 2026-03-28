import { SandClock } from '@/components/icons/sandClock';
import { ModuleTask } from '@/hooks/groups/useProjectsModule';

function normalizeKnowledge(value: string): string[] {
  if (!value.trim()) {
    return [];
  }

  return value
    .split(/[,;/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function renderTag(text: string, key: string) {
  return (
    <div
      key={key}
      className="
        flex items-center justify-center
        py-[2px] px-[5px]
        text-[8px] leading-[130%] font-normal
        tracking-[-0.5px]
        rounded-[5px]
        bg-[#6BCF8E] text-white
        truncate
      "
    >
      {text}
    </div>
  );
}

export default function MobileTaskCard({ task }: { task: ModuleTask }) {
  const skills = Array.isArray(task.Skills)
    ? task.Skills.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const knowledge = normalizeKnowledge(task.Knowledge ?? '');

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="text-[10px] font-normal leading-[130%] text-white tracking-[-0.5px]">
        {task.TITLE}
      </div>

      <div className="text-[10px] font-medium text-white flex items-center gap-1 justify-between mt-[10px]">
        <div className="text-[10px] font-normal text-white leading-[130%] tracking-[-0.5px]">
          Навыки
        </div>
        <div className="flex items-center text-[8px] leading-[130%] tracking-[-0.5px] font-normal">
          <SandClock width={10} height={10} stroke={'#FFFFFF'} />{' '}
          {(task.TIME_ESTIMATE / 3600).toFixed(1)} часов
        </div>
      </div>

      <div className="flex flex-wrap gap-[5px] mt-[5px]">
        {skills.length > 0 ? (
          skills.map((item, index) => renderTag(item, `${item}-${index}`))
        ) : (
          <span className="text-[8px] text-white/70">Нет данных</span>
        )}
      </div>

      <div className="flex flex-col mt-[10px]">
        <div className="text-[10px] font-normal text-white leading-[130%] tracking-[-0.5px]">
          Знание
        </div>

        <div className="flex flex-wrap gap-[5px] mt-[5px]">
          {knowledge.length > 0 ? (
            knowledge.map((item, index) => renderTag(item, `${item}-${index}`))
          ) : (
            <span className="text-[8px] text-white/70">Нет данных</span>
          )}
        </div>
      </div>
    </div>
  );
}
