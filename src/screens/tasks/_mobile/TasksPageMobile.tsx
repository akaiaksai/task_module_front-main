// TasksPageMobile.tsx
import { useElapsedTimes } from '@/hooks/tasks/elapsed-times/useElapsedTimes';
import { useTasks } from '@/hooks/tasks/useTaskActions';
import { useAuthStore } from '@/store/auth';
import { useTaskFiltersStore } from '@/store/task-filters';
import { useUIStore } from '@/store/ui';
import { addDays, format, isSameDay, parseISO } from 'date-fns';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import MobileCalendar from './_calendar/MobileCalendar';
import { EisenhowerMatrixMobile } from './_eisenhower/EisenhowerMatrix';

const MEETINGS_ID = 6;

// Компонент для заглушки Kanban
const KanbanBoardMobile = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-white rounded-lg">
      <div className="text-gray-800 text-lg">Канбан доска - в разработке</div>
    </div>
  );
};

// Компонент для заглушки Gantt
const GanttChartMobile = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-white rounded-lg">
      <div className="text-gray-800 text-lg">
        Диаграмма Ганта - в разработке
      </div>
    </div>
  );
};

// Компонент для Групп
const GroupsMobile = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-white rounded-lg">
      <div className="text-gray-800 text-lg">Группы - в разработке</div>
    </div>
  );
};

// Компонент для Проектов
const ProjectsMobile = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-white rounded-lg">
      <div className="text-gray-800 text-lg">Проекты - в разработке</div>
    </div>
  );
};

// Типы для режимов отображения
type DisplayMode =
  | 'kanban'
  | 'gantt'
  | 'calendar'
  | 'eisenhower'
  | 'groups'
  | 'projects';

export default function TasksPageMobile() {
  const { userId } = useAuthStore();
  const {
    onlyMyTasks,
    onlyAuditor,
    onlyAccomplice,
    onlyCreator,
    search: globalSearch,
    status: globalStatus,
    selectedDate,
    setSelectedDate,
  } = useTaskFiltersStore();

  const { setMeetingTasks, setDayTasks } = useUIStore();

  const [searchParams] = useSearchParams();
  const displayMode = (searchParams.get('view') as DisplayMode) || 'calendar';

  // Устанавливаем текущую дату при монтировании
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
  }, [selectedDate, setSelectedDate]);

  // Определяем, является ли режим связанным с задачами
  const isTaskMode = ['kanban', 'gantt', 'calendar', 'eisenhower'].includes(
    displayMode
  );

  const dateRange = useMemo(() => {
    const start = selectedDate;
    const end = addDays(selectedDate, 6);
    return {
      dateFrom: format(start, 'yyyy-MM-dd'),
      dateTo: format(end, 'yyyy-MM-dd'),
      startDate: start,
      endDate: end,
    };
  }, [selectedDate]);

  // Параметры запроса для задач только в режимах задач
  const currentQueryParams = useMemo(
    () => ({
      search: globalSearch || undefined,
      status: globalStatus === ' ' ? undefined : globalStatus,
      onlyMyTasks,
      onlyAuditor,
      onlyAccomplice,
      onlyCreator,
      currentUserId: userId,
      dateFrom: dateRange.dateFrom,
      dateTo: dateRange.dateTo,
      page: 1,
      perPage: 10000,
    }),
    [
      globalSearch,
      globalStatus,
      onlyMyTasks,
      onlyAuditor,
      onlyAccomplice,
      onlyCreator,
      userId,
      dateRange.dateFrom,
      dateRange.dateTo,
    ]
  );

  const {
    data: tasksData,
    isLoading: isLoadingTasks,
    error: tasksError,
    isFetching: isFetchingTasks,
  } = useTasks(isTaskMode ? { ...currentQueryParams, selectedDate } : {}, {
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    enabled: isTaskMode,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!tasksData?.items || !isTaskMode) {
      return;
    }

    const todaysUserTasks = tasksData.items.filter((task) => {
      if (!task.dueDate) {
        return false;
      }

      const d = parseISO(task.dueDate);
      if (!isSameDay(d, selectedDate)) {
        return false;
      }

      // "задачи пользователя": исполнитель или соисполнитель
      const isParticipant = task.assigneeId === userId;

      return isParticipant;
    });

    setDayTasks(todaysUserTasks);

    const todaysMeetings = todaysUserTasks.filter(
      (t) => t.groupId === MEETINGS_ID
    );
    setMeetingTasks(todaysMeetings);
  }, [
    tasksData?.items,
    selectedDate,
    setMeetingTasks,
    setDayTasks,
    isTaskMode,
    userId,
  ]);

  const renderContent = () => {
    switch (displayMode) {
      case 'kanban':
        return <KanbanBoardMobile />;
      case 'gantt':
        return <GanttChartMobile />;
      case 'eisenhower':
        return <EisenhowerMatrixMobile tasks={tasksData?.items || []} />;
      case 'groups':
        return <GroupsMobile />;
      case 'projects':
        return <ProjectsMobile />;
      case 'calendar':
      default:
        return (
          <div className="w-full h-full">
            <MobileCalendar
              tasks={tasksData?.items || []}
              startHour={8}
              endHour={25}
              hourHeight={50}
              backgroundColor="white"
              lineColor="black"
              currentTimeColor="#E77B7BCC"
              selectedDate={selectedDate}
              groupView={true}
              useElapsedTimes={useElapsedTimes}
              userId={userId}
              isAdmin={false}
              timeOffsetMinutes={60}
            />
          </div>
        );
    }
  };

  if (tasksError && isTaskMode) {
    return (
      <div className="w-full h-screen p-4 flex items-center justify-center bg-white">
        <div className="text-red-600">Ошибка загрузки задач</div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex flex-col relative font-roboto"
      style={{ backgroundColor: '#FFFFFF' }}
    >
      {/* Основной контент */}
      <div className="flex-1 w-full overflow-hidden">{renderContent()}</div>

      {/* Индикатор загрузки только для режимов задач */}
      {isTaskMode && (isLoadingTasks || isFetchingTasks) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-40">
          <div className="text-white">Загрузка...</div>
        </div>
      )}
    </div>
  );
}
