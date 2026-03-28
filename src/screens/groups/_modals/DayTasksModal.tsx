import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar, Clock, X } from 'lucide-react';
import { getDisplayName } from '../../../hooks/groups/useGroupsAndMembers';
import { UserAvatar } from '../UserAvatar';

export function DayTasksModal({
  isOpen,
  onClose,
  day,
  user,
  tasks,
  onTaskClick,
}: {
  isOpen: boolean;
  onClose: () => void;
  day: Date;
  user: ANY;
  tasks: ANY[];
  onTaskClick: (taskId: string) => void;
}) {
  if (!isOpen) {
    return null;
  }

  const userName = getDisplayName(user);
  const formattedDate = format(day, 'EEEE, d MMMM yyyy', { locale: ru });

  return (
    <>
      {/* Затемнение фона */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Модальное окно */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Заголовок */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <UserAvatar user={user} />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {userName}
                </h2>
                <div className="flex items-center space-x-2 text-gray-600 mt-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{formattedDate}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Контент */}
          <div className="flex-1 overflow-y-auto p-6">
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <div className="text-gray-900 font-medium mb-2">Нет задач</div>
                <p className="text-gray-500">
                  На этот день нет запланированных задач
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-2">
                  Всего задач: {tasks.length}
                </div>
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      onTaskClick(task.id);
                      onClose();
                    }}
                    className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`
                        w-3 h-3 rounded-full mt-1 flex-shrink-0
                        ${
                          task.status === 'completed'
                            ? 'bg-green-500'
                            : task.status === 'in_progress'
                              ? 'bg-blue-500'
                              : 'bg-gray-400'
                        }
                      `}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 line-clamp-2">
                          {task.title}
                        </div>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          {task.dueDate && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {format(parseISO(task.dueDate), 'HH:mm')}
                              </span>
                            </div>
                          )}
                          <div
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
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Футер */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
