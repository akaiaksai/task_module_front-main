// src/components/smart/mobileHeader/MobileHeader.tsx

import { WeekPicker } from '@/components/dumb';
import { createTask } from '@/lib/api/tasks/tasks';
import TaskFormModal from '@/screens/tasks/_desktop/_tasks-modals/TaskFormModal';
import { useTaskFiltersStore } from '@/store/task-filters';
import { useUIStore } from '@/store/ui';
import { useState } from 'react';
import { MeetingCalendarHeader } from '../meetingCalendarHeader';
import { SlotCreateModal, SlotsPanel } from '../SlotsPanel';

// COMMENT
// interface MobileHeaderProps {
//   /** Является ли пользователь администратором */
//   isAdmin: boolean;
// }

/**
 * Главный компонент мобильного хедера
 * Содержит навигацию, календарь и модалку создания встречи
 */
export function MobileHeader() {
  // State из Zustand
  const { headerBottomContent, meetingTasks, dayTasks, setIsCalendarOpen } =
    useUIStore();
  const { selectedDate, setSelectedDate } = useTaskFiltersStore();
  const [activeTab, setActiveTab] = useState<'meetings' | 'slots' | null>(null);
  const [slotModalOpen, setSlotModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<30 | 60>(60);

  const handleSelectSlot = (slot: string, duration: 30 | 60) => {
    setSelectedSlot(slot);
    setSelectedDuration(duration);
    setSlotModalOpen(true);
  };
  // COMMENT
  // const { userId } = useAuthStore();

  // Локальный state
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);

  // Проверяем, находимся ли мы на странице просмотра задачи
  // const isTaskViewPage = location.pathname.startsWith('/tasks/');

  /**
   * Подсчет встреч на выбранную дату
   * Учитываются только встречи, где текущий пользователь - исполнитель или соисполнитель
   */
  // COMMENT
  // const selectedDateTasksCount = useMemo(() => {
  //   return meetingTasks.filter((task) => {
  //     if (!task.dueDate) return false;

  //     const taskDate = new Date(task.dueDate);
  //     const isTaskOnSelectedDate = isSameDay(taskDate, selectedDate);

  //     const isAssigneeOrAccomplice =
  // eslint-disable-next-line no-warning-comments
  //       task.assigneeId === userId ||
  // eslint-disable-next-line no-warning-comments
  //       task.accomplices?.includes(userId as number);

  //     return isTaskOnSelectedDate && isAssigneeOrAccomplice;
  //   }).length;
  // }, [meetingTasks, selectedDate, userId]);

  // Handlers

  const handleCreateMeeting = () => {
    setIsMeetingModalOpen(true);
  };

  const handleCloseMeetingModal = () => {
    setIsMeetingModalOpen(false);
  };

  /**
   * Обработка создания встречи
   * Автоматически устанавливает GROUP_ID = 6 (группа "Встречи")
   */
  const handleMeetingSubmit = async (formData: ANY) => {
    try {
      console.log('Создание встречи →', formData);

      await createTask(formData);

      handleCloseMeetingModal();
      setIsCalendarOpen(true);
    } catch (error) {
      console.error('Ошибка при создании встречи:', error);
    }
  };

  return (
    <>
      <header className="sticky w-full top-0 z-[80] bg-mobile-header lg:hidden pt-[8px] pb-[12px] rounded-b-[14px] font-roboto ui-glow">
        <WeekPicker
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {/* Календарь встреч */}
        <div className="px-4 mb-[22px]">
          {activeTab === 'meetings' && (
            <MeetingCalendarHeader
              isOpen
              onCreateMeeting={handleCreateMeeting}
              tasks={meetingTasks}
            />
          )}

          {activeTab === 'slots' && (
            <SlotsPanel
              tasks={dayTasks} // ✅ реальные задачи дня
              selectedDate={selectedDate}
              onSelectSlot={handleSelectSlot}
            />
          )}
        </div>

        <div className="relative z-20">
          <HeaderTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Стрелочка для раскрытия календаря встреч */}
        {/* {!isTaskViewPage && (
          <div className="absolute bottom-2 left-1/2 z-[1001] transform -translate-x-1/2 flex items-center space-x-2">
            <button
              onClick={toggleCalendar}
              className="flex items-center justify-center w-8 h-6 text-gray-500 transition-colors"
            >
              {isCalendarOpen ? (
                <ChevronUp className="w-7 h-7" />
              ) : (
                <ChevronDown className="w-7 h-7" />
              )}
            </button>
          </div>
        )} */}

        {headerBottomContent && (
          <div className="rounded-b-2xl">{headerBottomContent}</div>
        )}
        <SlotCreateModal
          open={slotModalOpen}
          slot={selectedSlot}
          duration={selectedDuration}
          onClose={() => setSlotModalOpen(false)}
        />
      </header>

      <TaskFormModal
        open={isMeetingModalOpen}
        onClose={handleCloseMeetingModal}
        onSubmit={handleMeetingSubmit}
        mode="create"
        isLoading={false}
        initialData={{
          TITLE: 'Новая встреча',
          GROUP_ID: 6,
          DESCRIPTION: '',
          RESPONSIBLE_ID: undefined,
          DEADLINE: '',
          ACCOMPLICES: [],
          AUDITORS: [],
        }}
      />
    </>
  );
}

function HeaderTabs({
  activeTab,
  onChange,
}: {
  activeTab: 'meetings' | 'slots' | null;
  onChange: (v: 'meetings' | 'slots' | null) => void;
}) {
  return (
    <div className="flex justify-center gap-[122px] pb-[8px]">
      {[
        { id: 'meetings', label: 'Встречи' },
        { id: 'slots', label: 'Слоты' },
      ].map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() =>
              onChange(isActive ? null : (tab.id as 'meetings' | 'slots'))
            }
            className={`relative text-[14px] max-[420px]:text-[13px] leading-[130%] transition-colors ${
              isActive ? 'text-white' : 'text-white/75'
            }`}
          >
            {tab.label}
            <span
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full ${
                isActive ? 'bg-white' : 'bg-[#33C1E7]/45'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
