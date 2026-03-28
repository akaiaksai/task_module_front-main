import {
  getDisplayName,
  useGroupMembers,
} from '@/hooks/groups/useGroupsAndMembers';
import { useTasksFilters } from '@/hooks/tasks/forms/useTaskFilter';
import { useOccupancy } from '@/screens/tasks/_mobile/_calendar/hooks/useOccupancy';
import { useAuthStore } from '@/store/auth';
import { useTaskFiltersStore } from '@/store/task-filters';
import {
  getOccupancyColor,
  getOccupancyText,
} from '@/utils/occupancyCalculator';
import { getPeriodNorm } from '@/utils/time';
import { Users } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ProjectsBlock } from '../_projectBlock';
import { PaginationGrid } from '../_calendar/PaginationGrid';
import { UserCalendar } from '../_calendar/Calendar';
import { KanbanByDue } from '../_KanbanByDue';
import { ListView } from '../_list/ListView';
import TaskModal from '@/screens/tasks/_desktop/_tasks-modals/TaskModal';
import { DayTasksModal } from '../_modals/DayTasksModal';

interface MembersRowProps {
  members: ANY[];
  selectedMembers: number[];
  onMemberToggle: (memberId: number) => void;
  currentDate?: Date;
  viewMode?: 'month' | 'week' | 'day';
}

interface MemberOccupancyProps {
  memberTasks: ANY[];
  userId: number;
  currentDate: Date;
  viewMode: 'day' | 'week' | 'month';
}

const MemberOccupancy = memo(
  ({ memberTasks, userId, currentDate, viewMode }: MemberOccupancyProps) => {
    const occupancy = useOccupancy(userId, memberTasks, currentDate, viewMode);

    if (!occupancy) {
      return null;
    }

    return (
      <div
        className={`absolute -top-4 -right-3 text-[13.89px] text-center font-normal leading-[130%] p-[4px] rounded-[24px] border ${getOccupancyColor(
          occupancy.percentage
        )}`}
        title={getOccupancyText(
          occupancy.percentage,
          occupancy.estimatedHours,
          occupancy.elapsedHours
        )}
      >
        {Math.round(occupancy.percentage)}%
      </div>
    );
  }
);

MemberOccupancy.displayName = 'MemberOccupancy';

function MembersRow({
  members,
  selectedMembers,
  onMemberToggle,
  currentDate = new Date(),
  viewMode = 'week',
}: MembersRowProps) {
  const showOccupancy =
    viewMode === 'day' || viewMode === 'week' || viewMode === 'month';

  return (
    <div className="bg-white rounded-[14px] border border-gray-200 pt-[30px] pb-[15px] px-[30px] mb-6 font-roboto shadow-soft">
      <div className="flex flex-col items-center w-full mb-[36px]">
        <div className="flex flex-wrap justify-center gap-[35px] w-full">
          {members.map(({ user, tasks }) => {
            const isSelected = selectedMembers.includes(user.ID);

            return (
              <div key={user.ID} className="text-center relative group">
                <button
                  onClick={() => onMemberToggle(user.ID)}
                  className={`px-4 py-[8.5px] shadow-md shadow-[#00000052] border rounded-full text-[10px] font-normal leading-[130%] tracking-[-0.5px] transition-colors cursor-pointer relative ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-300 text-gray-800 hover:border-blue-500 hover:text-blue-600'
                  }`}
                >
                  {getDisplayName(user).split(' ')[0]}

                  {showOccupancy && (
                    <MemberOccupancy
                      memberTasks={tasks}
                      userId={user.ID}
                      currentDate={currentDate}
                      viewMode={viewMode}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {showOccupancy && (
        <div className="flex justify-center">
          <div
            className="flex items-center gap-[7px] text-[10px] font-normal leading-[130%] text-[#000000]
        bg-white px-4 py-[8.5px] rounded-[25px] border-[0.5px] shadow-md tracking-[-0.5px] shadow-[#00000052]"
          >
            <span>
              Занятость (норма{' '}
              {getPeriodNorm(viewMode as 'day' | 'week' | 'month')}ч)
            </span>
            <div className="flex items-center gap-1">
              <div className="w-[7px] h-[7px] rounded-full bg-[#53C41A]" />
              <span>&lt;60%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[7px] h-[7px] rounded-full bg-[#E5B702]" />
              <span>&lt;60-90%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[7px] h-[7px] rounded-full bg-[#E57002]" />
              <span>&lt;90-110%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[7px] h-[7px] rounded-full bg-[#EF4642]" />
              <span>&gt;110%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DesktopGroupsList() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<
    'month' | 'week' | 'day' | 'kanban' | 'list'
  >('week');
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const {
    onlyMyTasks,
    onlyAuditor,
    setOnlyMyTasks,
    onlyAccomplice,
    onlyCreator,
    search: globalSearch,
    status: globalStatus,
    period: globalPeriod,
  } = useTaskFiltersStore();

  useEffect(() => {
    if (onlyMyTasks) {
      setOnlyMyTasks(false);
    }
  }, []);

  const { filters } = useTasksFilters();
  const [localFilters] = useState({
    responsibleId: '',
    createdBy: '',
  });

  const { isAdmin, userId } = useAuthStore();

  const queryParams = useMemo(() => {
    const params: ANY = {
      page: 1,
      perPage: 10000,
      search: globalSearch || undefined,
      status: globalStatus === ' ' ? undefined : globalStatus,
      sort: filters.sort || undefined,
      period: (globalPeriod as ANY) || undefined,
      responsibleId:
        isAdmin && localFilters.responsibleId
          ? Number(localFilters.responsibleId)
          : undefined,
      createdBy:
        isAdmin && localFilters.createdBy
          ? Number(localFilters.createdBy)
          : undefined,
      onlyMyTasks,
      onlyAuditor,
      onlyAccomplice,
      onlyCreator,
      currentUserId: userId,
    };

    // Убираем undefined значения
    Object.keys(params).forEach((key) => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    return params;
  }, [
    onlyMyTasks,
    onlyAuditor,
    onlyAccomplice,
    onlyCreator,
    globalSearch,
    globalStatus,
    globalPeriod,
    filters.sort,
    localFilters.responsibleId,
    localFilters.createdBy,
    isAdmin,
    userId,
  ]);

  const {
    project,
    members: allMembers,
    isLoading,
    error,
  } = useGroupMembers(projectId || '', queryParams);

  const [dayModal, setDayModal] = useState<{
    isOpen: boolean;
    day: Date | null;
    user: ANY | null;
    tasks: ANY[];
  }>({
    isOpen: false,
    day: null,
    user: null,
    tasks: [],
  });

  const toggleMemberSelection = useCallback((memberId: number) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  }, []);

  const displayedMembers = useMemo(() => {
    if (selectedMemberIds.length === 0) {
      return allMembers;
    }
    return allMembers.filter((member) =>
      selectedMemberIds.includes(member.user.ID)
    );
  }, [allMembers, selectedMemberIds]);
  const openTask = (taskId: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('m', 'task');
    newSearchParams.set('id', taskId);
    setSearchParams(newSearchParams, { replace: true });
  };

  const openDayModal = (day: Date, user: ANY, tasks: ANY[]) => {
    setDayModal({
      isOpen: true,
      day,
      user,
      tasks,
    });
  };

  const closeDayModal = () => {
    setDayModal({
      isOpen: false,
      day: null,
      user: null,
      tasks: [],
    });
  };

  if (isLoading && !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600 max-w-md">
          <div className="text-lg font-medium mb-2">Ошибка загрузки</div>
          <p className="text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-900 mb-2">
            Группа не найдена
          </div>
          <p className="text-gray-600">Запрошенная группа не существует</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-0">
        <div className="relative"></div>

        {allMembers.length > 0 &&
          viewMode !== 'kanban' &&
          viewMode !== 'list' && (
            <MembersRow
              members={allMembers}
              selectedMembers={selectedMemberIds}
              onMemberToggle={toggleMemberSelection}
              currentDate={currentDate}
              viewMode={viewMode}
            />
          )}

        {(viewMode === 'month' ||
          viewMode === 'week' ||
          viewMode === 'day') && (
          <ProjectsBlock
            currentDate={currentDate}
            viewMode={viewMode}
            onDateChange={setCurrentDate}
            onModeChange={setViewMode}
          />
        )}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-50 z-10 flex items-center justify-center rounded-lg mt-60">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Загрузка задач...</p>
              </div>
            </div>
          )}

          {displayedMembers.length === 0 && !isLoading ? (
            <div className="text-center py-12 lg:py-16 bg-white rounded-lg border border-gray-200">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <div className="text-gray-900 mb-2">Нет выбранных участников</div>
              <p className="text-gray-500 px-4">
                {selectedMemberIds.length > 0
                  ? 'Выберите других участников или сбросьте фильтр'
                  : 'В этой группе пока нет участников с задачами'}
              </p>
              {selectedMemberIds.length > 0 && (
                <button
                  onClick={() => setSelectedMemberIds([])}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Показать всех участников
                </button>
              )}
            </div>
          ) : (
            <>
              {(viewMode === 'month' ||
                viewMode === 'week' ||
                viewMode === 'day') && (
                <PaginationGrid
                  items={displayedMembers}
                  renderItem={({ user, tasks }) => (
                    <UserCalendar
                      key={user.ID}
                      user={user}
                      tasks={tasks}
                      onTaskClick={openTask}
                      onDayClick={(day, dayTasks) =>
                        openDayModal(day, user, dayTasks)
                      }
                      viewMode={viewMode}
                      projectId={projectId}
                      compact={false}
                      currentDate={currentDate}
                    />
                  )}
                />
              )}

              {viewMode === 'kanban' && (
                <KanbanByDue
                  members={displayedMembers}
                  onTaskClick={openTask}
                />
              )}

              {viewMode === 'list' && (
                <ListView members={displayedMembers} onTaskClick={openTask} />
              )}
            </>
          )}
        </div>
      </div>

      <TaskModal />

      <DayTasksModal
        isOpen={dayModal.isOpen}
        onClose={closeDayModal}
        day={dayModal.day!}
        user={dayModal.user!}
        tasks={dayModal.tasks}
        onTaskClick={openTask}
      />
    </div>
  );
}
