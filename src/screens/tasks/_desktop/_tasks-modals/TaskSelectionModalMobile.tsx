import MobileModal from '@/ui/MobileModal';
import Button from '@/ui/Button';
import { RotateCw } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';

import { useTaskSelectionModalLogic } from '@/hooks/tasks/modal/useTaskSelectionModalLogic';
import { ModalCalendar } from '@/components/icons/ModalCalendar';
import { TomorrowIcon } from '@/components/icons/TomorrowIcon';
import { OnWeekIcon } from '@/components/icons/onWeek';
import { AllMeetings } from '@/components/icons/allMeetings';
import { useTaskCard } from '@/hooks/tasks/modal/useTaskCards';
import { ActiveTaskCardMobile } from '@/components/dumb/activeTaskCard/ActiveTaskCardMobile';

export const TaskSelectionModalMobile = () => {
  const logic = useTaskSelectionModalLogic();

  if (!logic.isOpen) {
    return null;
  }

  return (
    <MobileModal open={logic.isOpen} onClose={logic.closeModal}>
      <div className="flex flex-col px-3 py-[24px] text-white">
        <h2 className="text-[16px] font-medium mb-5 leading-[130%] tracking-[-0.5px]">
          {logic.mode === 'pause'
            ? 'Если переключаешься на другую задачу — заполни ниже причину и выбери из других'
            : 'Продолжаем по плану?'}
        </h2>

        {logic.mode === 'pause' && (
          <input
            value={logic.pauseComment}
            onChange={(e) => logic.setPauseComment(e.target.value)}
            placeholder="Введите комментарий"
            className="
                    h-[33px]
                    border border-[#8AE6FF80]
                    bg-[#8AE6FF1F]
                    text-[14px]
                    font-semibold tracking-[-0.5px]
                    text-[#FFFFFF99]
                    placeholder:text-[#FFFFFF99]
                    text-white
                    px-3
                    py-2
                    rounded-[8px]
                    mb-[25px]
                  "
          />
        )}

        {logic.mode === 'complete' && logic.pausedTask && (
          <>
            <div className="flex gap-3 mb-5">
              <div className="flex-1">
                <ActiveTaskCardMobile
                  task={logic.pausedTask}
                  elapsedMs={logic.spentMs}
                  plannedMs={logic.plannedMs}
                  assignee={logic.assignee}
                  createdBy={logic.createdByUser}
                  previewImage={
                    logic.activePreviewImage
                      ? {
                          downloadUrl: logic.activePreviewImage.downloadUrl,
                          name: logic.activePreviewImage.name,
                        }
                      : undefined
                  }
                  hideActions
                />
              </div>

              <div className="flex flex-col gap-5 w-[138px]">
                <button
                  onClick={logic.handleCreateIntermediate}
                  className="
                    h-[58px]
                    rounded-[8px]
                    bg-[#8AE6FF26]
                    px-3
                    py-3
                    ui-glow-desktop
                    text-left
                  "
                >
                  <div className="text-[12px] font-normal tracking-[-0.83px] mb-[5px]">
                    Промежуточные дела
                  </div>
                  <div className="text-[10px] font-normal">Создать</div>
                </button>

                <div
                  className="
                    h-[58px]
                    rounded-[8px]
                    bg-[#8AE6FF26]
                    px-3
                    py-[10px]
                    ui-glow-desktop
                    text-left
                  "
                >
                  <div className="text-[12px] font-normal tracking-[-0.83px] mb-[5px]">
                    Перерыв
                  </div>
                  <div className="text-[10px] font-normal leading-[130%] tracking-[-0.5px] text-nowrap">
                    <span className="mr-1">Напомнить после</span>
                    <input
                      type="number"
                      min={1}
                      value={logic.breakMinutes}
                      onChange={(e) =>
                        logic.setBreakMinutes(
                          Math.max(1, Number(e.target.value))
                        )
                      }
                      className="
                          w-[20px]
                          bg-transparent
                          border-b
                          border-white/50
                          text-center
                          outline-none
                        "
                    />
                    <span className="ml-1">мин</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-5 text-[16px] font-semibold tracking-[-0.5px]">
              Если нет — укажи причину и выбери из других
            </div>

            <input
              value={logic.pauseComment}
              onChange={(e) => logic.setPauseComment(e.target.value)}
              placeholder="Введите комментарий"
              className="
        h-[34px]
        border
        border-[#8AE6FF80]
        bg-[#8AE6FF1F]
        text-[14px]
        font-semibold
        tracking-[-0.5px]
        text-white
        placeholder:text-[#FFFFFF99]
        px-3
        py-2
        rounded-[8px]
        mb-5
      "
            />
          </>
        )}

        {logic.mode === 'pause' && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div
              onClick={logic.handleCreateIntermediate}
              className="rounded-xl bg-[#8AE6FF26] px-3 py-3 ui-glow-desktop cursor-pointer max-h-[58px]"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-[5px]">
                  <div className="text-[12px] font-normal tracking-[-0.83px] leading-[130%]">
                    Промежуточные дела
                  </div>
                  <div className="text-[10px] font-normal tracking-[-0.83px]">
                    Создать
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#8AE6FF26] px-3 py-3 ui-glow-desktop max-h-[58px]">
              <div className="flex items-start justify-between">
                <div className="space-y-[5px]">
                  <div className="text-[12px] font-normal tracking-[-0.83px] leading-[130%]">
                    Перерыв
                  </div>
                  <div className="flex items-center text-[10px]">
                    <span className="mr-1">Напомнить после</span>
                    <input
                      type="number"
                      min={1}
                      value={logic.breakMinutes}
                      onChange={(e) =>
                        logic.setBreakMinutes(
                          Math.max(1, Number(e.target.value))
                        )
                      }
                      className="w-[20px] bg-transparent border-b border-white/50 text-center outline-none"
                    />
                    <span>мин</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-[3px] no-scrollbar mb-5">
          <Tab
            label="Сегодня"
            icon={<ModalCalendar width={12} height={12} />}
            active={logic.activeTab === 'today'}
            onClick={() => logic.setActiveTab('today')}
          />
          <Tab
            label="Завтра"
            icon={<TomorrowIcon width={12} height={12} />}
            active={logic.activeTab === 'tomorrow'}
            onClick={() => logic.setActiveTab('tomorrow')}
          />
          <Tab
            label="На неделе"
            icon={<OnWeekIcon width={12} height={12} />}
            active={logic.activeTab === 'week'}
            onClick={() => logic.setActiveTab('week')}
          />
          <Tab
            label="Все встречи"
            icon={<AllMeetings width={12} height={12} />}
            active={logic.activeTab === 'all'}
            onClick={() => logic.setActiveTab('all')}
          />
        </div>

        {/* ===== Обновить ===== */}
        <button
          onClick={logic.handleRefresh}
          className="flex items-center gap-1 text-[8px] mb-3 opacity-80"
        >
          <RotateCw
            height={10}
            width={10}
            className={logic.isRefreshing ? 'animate-spin' : ''}
          />
          Обновить
        </button>

        {logic.tasksByTab[logic.activeTab].length > 0 ? (
          <div className="overflow-x-auto touch-pan-x">
            <Swiper
              slidesPerView="auto"
              spaceBetween={15}
              direction="horizontal"
              nested
              touchStartPreventDefault={false}
              touchMoveStopPropagation
              resistanceRatio={0}
            >
              {logic.tasksByTab[logic.activeTab].map((task) => (
                <SwiperSlide key={task.id} style={{ width: 167.42 }}>
                  <TaskCardContainer
                    task={task}
                    usersMap={logic.usersMap}
                    onStart={logic.handleStartFromCard}
                    onComplete={logic.handleCompleteFromCard}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : (
          <div className="text-sm opacity-60">Нет задач</div>
        )}

        <div className="flex justify-center">
          <Button
            onClick={logic.handleSave}
            disabled={logic.isSaveDisabled}
            variant="ghost"
            className="mt-5 h-[41px] w-[257px] !text-[16px] !font-semibold !tracking-[-0.5px] rounded-xl ui-glow-desktop !bg-[#8AE6FF26] border border-[#8AE6FF80]"
          >
            {logic.mode === 'complete' ? 'Завершить' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </MobileModal>
  );
};

const Tab = ({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-[4.88px] min-w-[82.3px] px-[5.83px] py-[4px] rounded-[4px] text-[10px] font-normal whitespace-nowrap
      ${active ? 'border border-[#8AE6FF80] ui-glow-desktop' : 'bg-[#8AE6FF26]'}`}
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
    <ActiveTaskCardMobile
      {...cardProps}
      elapsedMs={elapsedMs}
      plannedMs={plannedMs}
      previewImage={
        previewImage
          ? { downloadUrl: previewImage.downloadUrl, name: previewImage.name }
          : undefined
      }
      onPause={() => onStart(task)}
      onComplete={() => onComplete(task.id)}
    />
  );
};
