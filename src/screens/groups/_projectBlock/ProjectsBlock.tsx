import { DateButton } from '@/components/dumb/dateButton';
import { ModeSwitcher } from '@/components/dumb/modeSwitcher';
import { CalendarNavigation } from '@/components/dumb/сalendarNavigation';
import { useModuleProjectsWithTasks } from '@/hooks/groups/useProjectsModule';
import { getProjectColorById } from '@/screens/tasks/_mobile/_calendar/utils/projectColors';
import { endOfWeek, format, startOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useMatch } from 'react-router-dom';
import 'swiper/css';
import { Swiper, SwiperSlide } from 'swiper/react';
import CalendarPanel from '../_projectBlock/CalendarPanel/CalendarPanel';
import ProjectCard from '../_projectBlock/ProjectCard';

function calcProjectTotalHours(tasks: ANY[]) {
  if (!tasks || tasks.length === 0) {
    return 0;
  }

  console.log('CHECKING', tasks);

  const totalSeconds = tasks.reduce((sum, task) => {
    return sum + (task.TIME_ESTIMATE || 0);
  }, 0);

  return totalSeconds / 3600;
}

export function ProjectsBlock({
  currentDate,
  viewMode,
  onDateChange,
  onModeChange,
}: ANY) {
  const groupMatch = useMatch('/groups/:projectId');

  const currentGroupId = groupMatch?.params?.projectId
    ? Number(groupMatch.params.projectId)
    : null;

  const { projects, isLoading } = useModuleProjectsWithTasks({
    excludeCompleted: true,
    groupId: currentGroupId,
  });

  const [isOpen, setIsOpen] = useState(true);
  const [openedProject, setOpenedProject] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  //eslint-disable-next-line
  const [overlayLeft, setOverlayLeft] = useState(240);

  const opened = projects[openedProject!];
  const projectColor = getProjectColorById(opened?.ID);

  const openedTotalHours = opened ? calcProjectTotalHours(opened.tasks) : 0;

  useEffect(() => {
    if (openedProject !== null && containerRef.current) {
      const slideWidth = 270;
      const gap = 1;
      const left = openedProject * (slideWidth + gap) + slideWidth;
      setOverlayLeft(left);
    }
  }, [openedProject]);

  const getPeriodLabel = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'LLLL yyyy', { locale: ru });
    }

    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, 'd MMM', { locale: ru })} – ${format(end, 'd MMM', { locale: ru })}`;
    }

    return format(currentDate, 'd MMMM yyyy', { locale: ru });
  };

  return (
    <div className="w-full ui-glow-desktop bg-mobile-header rounded-[6px] py-[21.5px] px-8 flex text-white flex-col gap-4 font-roboto">
      <div className="flex items-center justify-between w-full">
        <div className="text-[14px] leading-[130%] font-normal tracking-[-0.83px]">
          Новые проекты
        </div>

        <div className="flex items-center gap-8">
          <ModeSwitcher
            modes={[
              { value: 'week', label: 'Неделя' },
              { value: 'month', label: 'Месяц' },
              { value: 'day', label: 'День' },
            ]}
            active={viewMode}
            onChange={onModeChange}
            containerClass="flex rounded-[7px] overflow-hidden shadow-soft"
            buttonClass="flex-1 px-[8px] py-[6px] text-[14px] font-normal tracking-[-0.83px] transition-colors leading-[130%]"
          />

          <CalendarNavigation
            label={getPeriodLabel()}
            currentDate={currentDate}
            viewMode={viewMode}
            onChange={onDateChange}
            className="font-normal text-[14px] leading-[130%] tracking-[-0.83px]"
            buttonClassName="hover:bg-[#8AE6FF26] text-[#666666] hover:text-[#adadad]"
            labelClassName=""
          />

          <div className="flex items-center gap-[27px] text-[14px] leading-[130%] font-normal">
            <div className="border rounded-[7px] border-[#66666633] py-[6px] px-5">
              <span>Свободное время:</span>
            </div>
            <div className="rounded-[7px] bg-[#8AE6FF26] py-[6px] px-[8px]">
              {openedProject !== null
                ? (projects[openedProject].FreeTimeWeeks[0] / 3600).toFixed(1) +
                  ' ч'
                : '0 ч'}
            </div>
          </div>

          <DateButton
            mode={viewMode}
            currentDate={currentDate}
            onClick={() => onDateChange(new Date())}
          />
        </div>

        <div className="flex items-center gap-1">
          <div className="w-[23px] h-[23px] px-[6.39px] flex items-center tabular-nums text-center justify-center rounded-[6.39px] bg-dark-glass text-white text-[17px] font-normal tracking-[-0.64px]">
            {projects?.length ?? 0}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-[6.39px] hover:text-gray-700"
          >
            {isOpen ? <ChevronUp /> : <ChevronDown />}
          </button>
        </div>
      </div>

      {/* ОТКРЫВАЮТСЯ КАРТОЧКИ С ПРОЕКТАМИ */}
      {isOpen && (
        <div className="w-full mt-5">
          {openedProject === null ? (
            <>
              {isLoading ? (
                <div className="p-4 text-sm text-gray-500">Загрузка…</div>
              ) : (
                <Swiper
                  slidesPerView={'auto'}
                  allowTouchMove={true}
                  grabCursor={true}
                  spaceBetween={12}
                  style={{ paddingRight: 5 }}
                >
                  {projects.map((p, i) => {
                    const totalHours = calcProjectTotalHours(p.tasks);
                    return (
                      <SwiperSlide key={i} style={{ width: 181 }}>
                        <ProjectCard
                          p={{
                            id: p.ID,
                            title: p.Title,
                            priority: Number(p.Priority),
                            start: p.DateStart,
                            end: p.DateFinish,
                            total: totalHours.toFixed(1) + ' ч',
                            free: (p.FreeTimeWeeks || []).map(
                              (sec) => (sec / 3600).toFixed(1) + ' ч'
                            ),
                            groupId: p.groupId,
                          }}
                          index={i}
                          isOpen={false}
                          onOpen={() => setOpenedProject(i)}
                        />
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              )}
            </>
          ) : (
            <>
              <div className="flex w-full gap-[12px]">
                <div className="shrink-0" style={{ width: 183 }}>
                  <ProjectCard
                    p={{
                      id: projects[openedProject].ID,
                      title: projects[openedProject].Title,
                      priority: Number(projects[openedProject].Priority),
                      start: projects[openedProject].DateStart,
                      end: projects[openedProject].DateFinish,
                      total: openedTotalHours.toFixed(1) + ' ч',
                      free: projects[openedProject].FreeTimeWeeks.map(
                        (sec) => (sec / 3600).toFixed(1) + ' ч'
                      ),
                      groupId: projects[openedProject].groupId,
                    }}
                    index={openedProject}
                    isOpen={true}
                    onClose={() => setOpenedProject(null)}
                    className={`rounded-[4px] border-[#8AE6FF80]`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <CalendarPanel
                    project={{
                      ...opened,
                      projectColor,
                    }}
                    currentDate={currentDate}
                    viewMode={viewMode}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
