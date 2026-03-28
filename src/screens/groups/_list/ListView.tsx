import { format, isBefore, isSameDay, parseISO, startOfDay } from 'date-fns';
import { AlignLeft, Calendar } from 'lucide-react';
import { useState } from 'react';
import { getDisplayName } from '../../../hooks/groups/useGroupsAndMembers';
import { UserAvatar } from '../UserAvatar';

function getFilterTitle(filter: string): string {
  const titles: Record<string, string> = {
    all: 'Все задачи',
    overdue: 'Просрочено',
    today: 'Сегодня',
    upcoming: 'Предстоящие',
    noDueDate: 'Без срока',
  };
  return titles[filter] || filter;
}

function getDueDateClass(dueDate: string): string {
  const taskDate = parseISO(dueDate);
  const today = startOfDay(new Date());

  if (isBefore(taskDate, today)) {
    return 'text-red-600 font-medium';
  } else if (isSameDay(taskDate, today)) {
    return 'text-green-600 font-medium';
  }
  return 'text-gray-600';
}

export function ListView({
  members,
  onTaskClick,
}: {
  members: ANY[];
  onTaskClick: (taskId: string) => void;
}) {
  const allTasks = members.flatMap(({ user, tasks }) =>
    tasks.map((task: ANY) => ({ ...task, user }))
  );

  // Сортируем задачи по дате выполнения (если есть)
  const sortedTasks = [...allTasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) {
      return 0;
    }
    if (!a.dueDate) {
      return 1;
    }
    if (!b.dueDate) {
      return -1;
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // Группируем задачи по статусу для фильтрации
  const statusGroups = {
    overdue: sortedTasks.filter(
      (t) => t.dueDate && isBefore(parseISO(t.dueDate), startOfDay(new Date()))
    ),
    today: sortedTasks.filter(
      (t) => t.dueDate && isSameDay(parseISO(t.dueDate), new Date())
    ),
    upcoming: sortedTasks.filter(
      (t) =>
        t.dueDate &&
        !isSameDay(parseISO(t.dueDate), new Date()) &&
        !isBefore(parseISO(t.dueDate), startOfDay(new Date()))
    ),
    noDueDate: sortedTasks.filter((t) => !t.dueDate),
  };

  const [activeFilter, setActiveFilter] = useState<
    'all' | 'overdue' | 'today' | 'upcoming' | 'noDueDate'
  >('all');

  const filteredTasks =
    activeFilter === 'all' ? sortedTasks : statusGroups[activeFilter];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Фильтры */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              activeFilter === 'all'
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Все задачи ({sortedTasks.length})
          </button>
          <button
            onClick={() => setActiveFilter('overdue')}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              activeFilter === 'overdue'
                ? 'bg-red-100 border-red-300 text-red-700'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Просрочено ({statusGroups.overdue.length})
          </button>
          <button
            onClick={() => setActiveFilter('today')}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              activeFilter === 'today'
                ? 'bg-green-100 border-green-300 text-green-700'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Сегодня ({statusGroups.today.length})
          </button>
          <button
            onClick={() => setActiveFilter('upcoming')}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              activeFilter === 'upcoming'
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Предстоящие ({statusGroups.upcoming.length})
          </button>
          <button
            onClick={() => setActiveFilter('noDueDate')}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              activeFilter === 'noDueDate'
                ? 'bg-gray-200 border-gray-400 text-gray-800'
                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Без срока ({statusGroups.noDueDate.length})
          </button>
        </div>
      </div>

      {/* Список задач */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <AlignLeft className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <div className="text-gray-900 font-medium mb-2">Нет задач</div>
            <p className="text-gray-500">
              {activeFilter === 'all'
                ? 'В группе пока нет задач'
                : `Нет задач в категории "${getFilterTitle(activeFilter)}"`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 lg:p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => onTaskClick(task.id)}
              >
                <div className="flex items-start gap-3 lg:gap-4">
                  {/* Аватар пользователя */}
                  <UserAvatar user={task.user} />

                  {/* Информация о задаче */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 lg:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base lg:text-lg font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Мета-информация */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-2 lg:gap-1 text-sm text-gray-500">
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span className={getDueDateClass(task.dueDate)}>
                              {format(
                                parseISO(task.dueDate),
                                'dd.MM.yyyy HH:mm'
                              )}
                            </span>
                          </div>
                        )}
                        <div className="text-xs lg:text-sm">
                          {getDisplayName(task.user)}
                        </div>
                      </div>
                    </div>

                    {/* Статус и теги */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span
                        className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${
                            task.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : task.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                          }
                        `}
                      >
                        {task.status === 'completed'
                          ? 'Завершена'
                          : task.status === 'in_progress'
                            ? 'В работе'
                            : 'Новая'}
                      </span>

                      {/* Индикатор просроченности */}
                      {task.dueDate &&
                        isBefore(
                          parseISO(task.dueDate),
                          startOfDay(new Date())
                        ) && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Просрочено
                          </span>
                        )}

                      {/* Приоритет (если есть в данных) */}
                      {task.priority && (
                        <span
                          className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${
                              task.priority === 'high'
                                ? 'bg-red-100 text-red-800'
                                : task.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                            }
                          `}
                        >
                          {task.priority === 'high'
                            ? 'Высокий'
                            : task.priority === 'medium'
                              ? 'Средний'
                              : 'Низкий'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
