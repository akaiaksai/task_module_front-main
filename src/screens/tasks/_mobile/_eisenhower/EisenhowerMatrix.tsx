// components/screens/tasks/_mobile/_eisenhower/EisenhowerMatrixMobile.tsx
import { MeetingCardHeader } from '@/components/smart';
import { useTasks } from '@/hooks/tasks/useTaskActions';
import { Task, TaskType } from '@/shared/types/task';
import { useAuthStore } from '@/store/auth';
import { useTaskFiltersStore } from '@/store/task-filters';
import { useState } from 'react';

interface EisenhowerMatrixMobileProps {
  tasks: Task[]; // задачи с фильтром по датам (для urgent, important, regular, helping)
}

interface EisenhowerCategory {
  type: TaskType;
  title: string;
  description: string;
  usesDateFilteredTasks?: boolean; // true = использует tasks из пропсов, false = использует отдельный запрос
}

const categories: EisenhowerCategory[] = [
  {
    type: 'urgent',
    title: 'Срочные',
    description: 'нужно сделать сейчас',
    usesDateFilteredTasks: true,
  },
  {
    type: 'important',
    title: 'Важные',
    description: 'нужно сделать сегодня',
    usesDateFilteredTasks: true,
  },
  {
    type: 'regular',
    title: 'Регулярные',
    description: 'ежедневные задачи',
    usesDateFilteredTasks: true,
  },
  {
    type: 'helping',
    title: 'Помогаю',
    description: 'красная точка? отработай!',
    usesDateFilteredTasks: true,
  },
  {
    type: 'controlling',
    title: 'Контролирую',
    description: 'красная точка? отработай!',
    usesDateFilteredTasks: false, // использует отдельный запрос без фильтра дат
  },
  {
    type: 'later',
    title: 'На потом',
    description: 'актуализировать раз в день',
    usesDateFilteredTasks: false, // использует отдельный запрос без фильтра дат
  },
];

export function getTaskTypeColorClass(type: TaskType): string {
  switch (type) {
    case 'urgent':
      return 'bg-[#EF4642] text-white';
    case 'important':
      return 'bg-[#E15A11] text-white';
    case 'regular':
      return 'bg-[#BA9400] text-white';
    case 'helping':
    case 'controlling':
    case 'later':
    case 'normal':
    default:
      return 'bg-white text-black border border-gray-300';
  }
}

background:;

function getTaskTypeCalendarColor(type: TaskType): {
  background: string;
  color: string;
  emptyColor: string;
  cardClassName: string;
  stopButtonClassName?: string;
} {
  switch (type) {
    case 'urgent':
      return {
        background:
          'radial-gradient(86.35% 165.74% at 95.42% 50%, #EA524F 11.54%, #970B08 100%)',
        color: '#FFFFFF',
        emptyColor: '#FFF',
        cardClassName:
          'bg-gradient-to-l from-[#792624] to-[#5E100E] border-[#FF5653EB] text-white',
      };
    case 'important':
      return {
        background:
          'radial-gradient(86.35% 165.74% at 95.42% 50%, #F98445 0.65%, #E15A11 100%)',
        color: '#FFFFFF',
        emptyColor: '#FFF',
        cardClassName:
          'bg-gradient-to-l from-[#7C4021] to-[#702D09] border-[#FF8E4C80] text-white',
      };
    case 'regular':
      return {
        background:
          'radial-gradient(86.35% 165.74% at 95.42% 50%, #FFE272 0.65%, #E5B702 100%)',
        color: '#FFFFFF',
        emptyColor: '#000000',
        cardClassName:
          'bg-gradient-to-l from-[#765F02] to-[#765F03] border-[#F7FFA580] text-white',
      };
    // case 'helping':
    // case 'controlling':
    // case 'later':
    // case 'normal':
    default:
      return {
        background: '#FFFFFF',
        color: '#000000',
        emptyColor: '#6b7280',
        cardClassName:
          'bg-[#FFFFFF80] border-[#84848480] text-black after:bg-black ',
        stopButtonClassName: 'border-black',
      };
  }
}

export const EisenhowerMatrixMobile = ({
  tasks,
}: EisenhowerMatrixMobileProps) => {
  const [openCategory, setOpenCategory] = useState<TaskType | null>(null);
  const { userId } = useAuthStore();
  const {
    onlyMyTasks,
    onlyAuditor,
    onlyAccomplice,
    onlyCreator,
    search: globalSearch,
    selectedDate,
  } = useTaskFiltersStore();

  const {
    data: tasksWithoutDateFilter,
    isLoading: isLoadingWithoutDateFilter,
    error: errorWithoutDateFilter,
  } = useTasks(
    {
      search: globalSearch || undefined,
      status: '-5',
      onlyMyTasks,
      onlyAuditor,
      onlyAccomplice,
      onlyCreator,
      currentUserId: userId,
      page: 1,
      perPage: 10000,
      selectedDate,
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    }
  );

  const handleToggle = (type: TaskType) => {
    setOpenCategory(openCategory === type ? null : type);
  };

  const getTasksByType = (type: TaskType): Task[] => {
    const category = categories.find((cat) => cat.type === type);
    if (!category) {
      return [];
    }

    if (category.usesDateFilteredTasks) {
      return tasks.filter((task) => task.type === type);
    }

    if (!tasksWithoutDateFilter?.items) {
      return [];
    }

    if (type === 'later') {
      return tasksWithoutDateFilter.items.filter(
        (task) => task.type === 'later'
      );
    }

    console.log(tasksWithoutDateFilter);

    if (type === 'controlling') {
      return tasksWithoutDateFilter.items.filter(
        (task) => task.type === 'controlling'
      );
    }

    return [];
  };

  return (
    <div className="space-y-2 mt-5 px-[20px] pb-[20px]">
      {isLoadingWithoutDateFilter && (
        <div className="flex justify-center py-4">
          <div className="text-gray-500">Загрузка задач...</div>
        </div>
      )}

      {errorWithoutDateFilter && (
        <div className="flex justify-center py-4">
          <div className="text-red-500">Ошибка загрузки задач</div>
        </div>
      )}
      {categories.map((category) => {
        const categoryTasks = getTasksByType(category.type);
        const isOpen = openCategory === category.type;
        const calendarColors = getTaskTypeCalendarColor(category.type);

        return (
          <div
            key={category.type}
            className="overflow-hidden transition-all duration-200 rounded-[10px] shadow-md"
            style={{
              background: calendarColors.background,
              color: calendarColors.color,
            }}
          >
            {/* Заголовок категории */}
            <button
              onClick={() => handleToggle(category.type)}
              className={`w-full px-[18px] py-[12px] text-left flex items-center justify-between transition-colors   disabled:opacity-50 `}
              disabled={
                !category.usesDateFilteredTasks && isLoadingWithoutDateFilter
              }
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0 whitespace-nowrap overflow-hidden">
                <div className="font-semibold text-[clamp(14px,2.4vw,18px)]">
                  {category.title}
                </div>
                <div className="text-[clamp(10px,2vw,14px)] opacity-90">
                  {category.description}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                {categoryTasks.length > 0 && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full min-w-6 text-center ${
                      category.type === 'helping' ||
                      category.type === 'controlling' ||
                      category.type === 'later' ||
                      category.type === 'normal'
                        ? 'bg-gray-200 text-gray-800'
                        : 'bg-white bg-opacity-20 text-white'
                    }`}
                  >
                    {categoryTasks.length}
                  </span>
                )}

                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  } ${
                    category.type === 'helping' ||
                    category.type === 'controlling' ||
                    category.type === 'later' ||
                    category.type === 'normal'
                      ? 'text-gray-600'
                      : 'text-white'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {/* Содержимое категории */}
            {isOpen && (
              <div className="px-[16px] pb-[20px] flex flex-col gap-[12px]">
                {categoryTasks.length > 0 ? (
                  <>
                    {categoryTasks.map((task) => (
                      <MeetingCardHeader
                        key={task.id}
                        task={task}
                        className={calendarColors.cardClassName}
                        propsStyles={{
                          boxShadow:
                            '0px 0px 0.92px 0px rgba(0, 0, 0, 0.29), 0px 1.83px 1.83px 0px rgba(0, 0, 0, 0.26), 0px 3.66px 3.66px 0px rgba(0, 0, 0, 0.22), 0px 5.49px 5.49px 0px rgba(0, 0, 0, 0.19), 0px 9.15px 9.15px 0px rgba(0, 0, 0, 0.15), 0px 18.3px 18.3px 0px rgba(0, 0, 0, 0.1), 0px 0px 10px 0px rgba(151, 11, 8, 0.4)',
                        }}
                        stopButtonClassName={calendarColors.stopButtonClassName}
                      />
                    ))}
                  </>
                ) : (
                  <div
                    className="text-center text-sm"
                    style={{ color: calendarColors.emptyColor }}
                  >
                    Нет задач в этой категории
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
