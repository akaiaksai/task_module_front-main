import DesktopModal from '@/ui/DesktopModal';
import Button from '@/ui/Button';
import { RotateCw } from 'lucide-react';
import { useTaskSelectionModalLogic } from '@/hooks/tasks/modal/useTaskSelectionModalLogic';
import { ActiveTaskCard } from '@/components/dumb/activeTaskCard';
import { WorkClock } from '@/components/icons/workClock';
import { CoffeeIcon } from '@/components/icons/coffeeIcon';
import { ModalCalendar } from '@/components/icons/ModalCalendar';
import { TomorrowIcon } from '@/components/icons/TomorrowIcon';
import { OnWeekIcon } from '@/components/icons/onWeek';
import { AllMeetings } from '@/components/icons/allMeetings';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useTaskCard } from '@/hooks/tasks/modal/useTaskCards';

export const TaskSelectionModalDesktop = () => {
  const logic = useTaskSelectionModalLogic();

  if (!logic.isOpen) {
    return null;
  }

  return (
    <DesktopModal open={logic.isOpen} onClose={logic.closeModal}>
      <div className="flex flex-col gap-10 px-[24px] py-[44px] text-white">
        <div
          className={`grid items-start ${
            logic.mode === 'pause'
              ? 'grid-cols-[1fr_300px] gap-[111px]'
              : 'grid-cols-[auto_1fr_300px] gap-[40px]'
          }`}
        >
          <div>
            <h2 className="text-[24px] font-semibold tracking-[-0.5px]">
              {logic.mode === 'pause'
                ? 'Если переключаешься на другую задачу — заполни ниже причину и выбери из других'
                : 'Продолжаем по плану?'}
            </h2>
            {logic.mode === 'pause' && (
              <div className="mt-[20px]">
                <textarea
                  value={logic.pauseComment}
                  onChange={(e) => logic.setPauseComment(e.target.value)}
                  placeholder="Введите комментарий"
                  className="
                        w-full
                        border border-[#8AE6FF80]
                        bg-[#8AE6FF1F]
                        text-[16px]
                        h-[74px]
                        font-semibold
                        tracking-[-0.5px]
                        text-white
                        placeholder:text-[#FFFFFF99]
                        px-3
                        py-[8px]
                        rounded-[8px]
                        resize-none
                      "
                />
              </div>
            )}
          </div>
          {logic.mode !== 'pause' && (
            <ActiveTaskCard
              task={logic.pausedTask}
              elapsedMs={logic.spentMs}
              plannedMs={logic.plannedMs}
              assignee={logic.assignee}
              previewImage={
                logic.activePreviewImage
                  ? {
                      downloadUrl: logic.activePreviewImage.downloadUrl,
                      name: logic.activePreviewImage.name,
                    }
                  : undefined
              }
              createdBy={logic.createdByUser}
              onPause={() => console.log('pause')}
              onComplete={() => console.log('complete')}
              hideActions
            />
          )}

          <div className="flex flex-col gap-5">
            <div
              onClick={logic.handleCreateIntermediate}
              className="bg-[#8AE6FF26] rounded-xl px-3 py-[10px] ui-glow-desktop cursor-pointer hover:bg-[#243842] transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <div className="text-[16px] font-normal tracking-[-0.83px] leading-[130%] mb-[7.5px]">
                    Промежуточные дела
                  </div>
                  <div className="text-[14px] font-normal leading-[130%] tracking-[-0.83px]">
                    Создать
                  </div>
                </div>

                <WorkClock
                  fill="#4AEDFF"
                  width={24}
                  height={26}
                  className="shrink-0"
                />
              </div>
            </div>

            <div className="bg-[#8AE6FF26] rounded-xl px-3 py-[10px] ui-glow-desktop  hover:bg-[#243842] transition">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-[6px]">
                  <div className="text-[16px] font-normal tracking-[-0.83px] leading-[130%]">
                    Перерыв
                  </div>

                  <div className="flex items-center gap-[6px] text-[14px] tracking-[-0.83px]">
                    <span>Напомнить после</span>

                    <input
                      type="number"
                      min={1}
                      value={logic.breakMinutes}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        logic.setBreakMinutes(
                          Math.max(1, Number(e.target.value))
                        )
                      }
                      className="
                                w-[32px]
                                h-[18px]
                                bg-transparent
                                border-0
                                border-b
                                border-white/50
                                text-center
                                text-white
                                text-[16px]
                                leading-none
                                outline-none
                                focus:border-[#ffffff]
                                [appearance:textfield]
                                [&::-webkit-inner-spin-button]:appearance-none
                                [&::-webkit-outer-spin-button]:appearance-none
                              "
                    />

                    <span>мин</span>
                  </div>
                </div>
                <CoffeeIcon className="shrink-0" width={24} height={24} />
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={logic.handleRefresh}
                className="
                      flex items-center gap-2
                      px-3 py-2
                      rounded-lg
                      border border-[#8AE6FF80]
                      bg-[#8AE6FF26]
                      text-sm font-medium
                      text-white
                      hover:bg-[#4360683f]
                      transition
                      ui-glow-desktop
                    "
              >
                <RotateCw
                  className={`w-4 h-4 transition ${
                    logic.isRefreshing ? 'animate-spin' : ''
                  }`}
                />
                Обновить
              </button>
            </div>
          </div>
        </div>

        {logic.mode === 'complete' && (
          <div className="grid grid-cols-[1fr_1fr] items-baseline gap-6">
            <div className="text-[24px] font-semibold leading-[130%] tracking-[-0.5px]">
              Если нет — укажи причину и выбери из других
            </div>

            <input
              value={logic.pauseComment}
              onChange={(e) => logic.setPauseComment(e.target.value)}
              placeholder="Введите комментарий"
              className="
                    h-[34px]
                    border border-[#8AE6FF80]
                    bg-[#8AE6FF1F]
                    text-[16px]
                    font-semibold tracking-[-0.5px]
                    text-white
                    placeholder:text-gray-400
                    px-3
                    py-2
                    rounded-[8px]
                  "
            />
          </div>
        )}

        <div className="flex gap-[40.67px]">
          <TabButton
            active={logic.activeTab === 'today'}
            label="Сегодня"
            icon={<ModalCalendar />}
            onClick={() => logic.setActiveTab('today')}
          />
          <TabButton
            active={logic.activeTab === 'tomorrow'}
            label="Завтра"
            icon={<TomorrowIcon />}
            onClick={() => logic.setActiveTab('tomorrow')}
          />
          <TabButton
            active={logic.activeTab === 'week'}
            label="На неделе"
            icon={<OnWeekIcon />}
            onClick={() => logic.setActiveTab('week')}
          />
          <TabButton
            active={logic.activeTab === 'all'}
            label="Все задачи"
            icon={<AllMeetings />}
            onClick={() => logic.setActiveTab('all')}
          />
        </div>

        <div className="w-full">
          {logic.tasksByTab[logic.activeTab].length > 0 ? (
            <Swiper
              spaceBetween={20}
              direction="horizontal"
              slidesPerView="auto"
              grabCursor
              className="!overflow-visible"
            >
              {logic.tasksByTab[logic.activeTab].map((task) => (
                <SwiperSlide
                  key={task.id}
                  style={{ width: 195 }}
                  className="!h-auto"
                >
                  <TaskCardContainer
                    task={task}
                    usersMap={logic.usersMap}
                    onStart={logic.handleStartFromCard}
                    onComplete={logic.handleCompleteFromCard}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="text-gray-400 text-sm">Нет задач</div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={logic.handleSave}
            disabled={logic.isSaveDisabled}
            variant="ghost"
            className="py-[10px] w-[257px] text-[16px] ui-glow-desktop font-semibold tracking-[-0.5px] bg-[#8ae6ff1f] text-white border rounded-[8px] border-[#8AE6FF80] hover:bg-[#4360683f]"
          >
            {logic.mode === 'complete' ? 'Завершить' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </DesktopModal>
  );
};

const TabButton = ({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-[10px] px-3 py-[10px] min-w-[210px] rounded-[8px] bg-[#8AE6FF26] text-[16px] tracking-[-0.83px] leading-[130%] font-normal transition
      ${active && 'border border-[#8AE6FF80] ui-glow-desktop'}`}
  >
    {icon}
    {label}
  </button>
);

const TaskCardContainer = ({
  task,
  usersMap,
  onStart,
  onComplete,
}: {
  task: ANY;
  usersMap: Map<number, ANY>;
  onStart: (task: ANY) => void;
  onComplete: (taskId: string) => void;
}) => {
  const { elapsedMs, plannedMs, previewImage, fullTask, mapTaskToActiveCard } =
    useTaskCard(task);

  const cardProps = mapTaskToActiveCard(
    {
      ...task,
      fileStats: task.fileStats ?? fullTask?.fileStats,
    },
    usersMap
  );

  return (
    <ActiveTaskCard
      {...cardProps}
      onPause={() => onStart(task)}
      onComplete={() => onComplete(task.id)}
      plannedMs={plannedMs}
      elapsedMs={elapsedMs}
      previewImage={
        previewImage
          ? {
              downloadUrl: previewImage.downloadUrl,
              name: previewImage.name,
            }
          : undefined
      }
    />
  );
};
