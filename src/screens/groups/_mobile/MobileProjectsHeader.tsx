import { useModuleProjectsWithTasks } from '@/hooks/groups/useProjectsModule';
import { getPeriodNorm } from '@/utils/time';
import { Code2, Filter, MonitorSmartphone, Target, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

type ViewMode = 'week' | 'month' | 'day';

interface Props {
  viewMode: ViewMode;
  currentDate: Date;
  onModeChange: (v: ViewMode) => void;
  isOpen: boolean;
  onDateChange: (date: Date) => void;
  onToggle: () => void;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function getOccupancyColor(value: number): string {
  if (value < 60) {
    return 'text-[#52CF45]';
  }

  if (value < 90) {
    return 'text-[#E8C545]';
  }

  if (value < 110) {
    return 'text-[#FF9C1A]';
  }

  return 'text-[#FF4E4E]';
}

function calcProjectOccupancyPercent(project: ANY, viewMode: ViewMode): number {
  const totalEstimateSeconds =
    Array.isArray(project?.tasks) && project.tasks.length > 0
      ? project.tasks.reduce((sum: number, task: ANY) => {
          const estimate = Number(task.TIME_ESTIMATE ?? task.timeEstimate ?? 0);
          return sum + (Number.isFinite(estimate) ? estimate : 0);
        }, 0)
      : Number(project?.TotalTimeEstimate ?? 0);

  const normSeconds = getPeriodNorm(viewMode) * 3600;
  if (normSeconds <= 0) {
    return 0;
  }

  return clampPercent((totalEstimateSeconds * 100) / normSeconds);
}

const ICONS = [Filter, Target, Code2, MonitorSmartphone, Users];

export function MobileProjectsHeader({ viewMode }: Props) {
  const { projectId } = useParams<{ projectId: string }>();

  const currentGroupId = projectId
    ? Number(projectId)
    : null;

  const { projects } = useModuleProjectsWithTasks({
    excludeCompleted: true,
    groupId: currentGroupId,
  });

  const cards = useMemo(() => {
    if (!projects?.length) {
      return [];
    }

    return projects.map((project, index) => {
      const Icon = ICONS[index % ICONS.length];
      return {
        id: `${project.ID}-${project.EntityTypeID}`,
        icon: Icon,
        percent: clampPercent(calcProjectOccupancyPercent(project, viewMode)),
      };
    });
  }, [projects, viewMode]);

  return (
    <section className="relative overflow-hidden rounded-b-[18px] border-b border-[#8AE6FF88] bg-[radial-gradient(128%_190%_at_62%_38%,rgba(17,83,110,0.92)_0%,rgba(18,30,62,0.98)_48%,rgba(7,8,14,1)_100%)] px-4 pb-6 pt-4 text-white shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cards.length === 0 && (
          <div className="w-full rounded-[12px] border border-[#8AE6FF44] bg-[#2A4E66AA] px-3 py-3 text-center text-[12px] text-[#D7E7F3] shadow-[0_0_14px_rgba(138,230,255,0.18)]">
            Нет данных по задачам
          </div>
        )}

        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              className="shrink-0 w-[74px] rounded-[12px] border border-[#8AE6FF44] bg-[#2A4E66AA] px-2 py-3 shadow-[0_0_14px_rgba(138,230,255,0.18)]"
            >
              <div
                className={`mb-5 text-center text-[29px] leading-none font-semibold drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] ${getOccupancyColor(
                  card.percent
                )}`}
              >
                {card.percent}%
              </div>
              <div className="flex justify-center">
                <Icon className="h-7 w-7 text-white/90" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
