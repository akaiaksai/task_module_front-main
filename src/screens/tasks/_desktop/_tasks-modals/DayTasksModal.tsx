import { Task } from '@/shared/types/task';
import Modal from '@/ui/Modal';
import { format, parseISO, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useSearchParams } from 'react-router-dom';
import { getGroupColor } from '../../_mobile/_calendar/utils/colors';

export default function DayTasksModal({ tasks }: { tasks: Task[] }) {
  const [sp, setSp] = useSearchParams();
  const isOpen = sp.get('m') === 'day';
  const date = sp.get('date') || ''; // YYYY-MM-DD
  const day = date ? parseISO(date) : null;

  const close = () => {
    const next = new URLSearchParams(sp);
    next.delete('m');
    next.delete('date');
    setSp(next, { replace: true });
  };

  // Функция для проверки, попадает ли день в диапазон задачи
  const isDayInTaskRange = (task: Task, day: Date) => {
    if (!task.dueDate) {
      return false;
    }

    const dueDate = parseISO(task.dueDate);
    const timeEstimate = task.timeEstimate || 0;

    const startDate = new Date(dueDate.getTime() - timeEstimate * 1000);

    const dayStart = startOfDay(day);
    const taskStart = startOfDay(startDate);
    const taskEnd = startOfDay(dueDate);

    return dayStart >= taskStart && dayStart <= taskEnd;
  };

  const dayTasks = day
    ? tasks.filter((t) => t.dueDate && isDayInTaskRange(t, day))
    : [];

  const openTask = (id: string) => {
    const next = new URLSearchParams(sp);
    next.set('m', 'task');
    next.set('id', id);
    next.delete('date');
    setSp(next, { replace: true });
  };

  return (
    <Modal
      open={isOpen}
      onClose={close}
      title={
        day
          ? `Задачи на ${format(day, 'd LLLL yyyy', { locale: ru })}`
          : 'Задачи за день'
      }
      maxWidth="max-w-xl"
    >
      <div className="space-y-2">
        {dayTasks.length === 0 && (
          <div className="text-sm text-neutral-500">На этот день задач нет</div>
        )}
        {dayTasks.map((t) => {
          const groupColor = getGroupColor(t.groupId);

          return (
            <button
              key={t.id}
              onClick={() => openTask(t.id)}
              className={`w-full text-left rounded-2xl border p-3 transition-all duration-200 relative overflow-hidden group 
                   ${groupColor.bg} 
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div
                    className={`text-sm font-medium ${
                      !t.dueDate ? 'text-orange-800' : groupColor.text
                    }`}
                  >
                    {t.title}
                  </div>
                  <div
                    className={`text-xs ${
                      !t.dueDate
                        ? 'text-orange-600'
                        : groupColor.text || 'text-neutral-500'
                    }`}
                  >
                    {t.dueDate
                      ? format(parseISO(t.dueDate), 'HH:mm', { locale: ru })
                      : 'Без срока'}
                  </div>
                </div>

                {/* Индикатор группы для задач со сроком */}
                {t.dueDate && (
                  <div
                    className="flex items-center gap-1 ml-2"
                    title={`Группа: ${t.groupId || 'Без группы'}`}
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" />
                  </div>
                )}
              </div>

              {/* Дополнительная информация */}
              <div
                className={`text-xs mt-1 ${
                  !t.dueDate
                    ? 'text-orange-500'
                    : groupColor.text || 'text-neutral-500'
                }`}
              >
                {!t.dueDate ? (
                  <>
                    Создана:{' '}
                    {format(parseISO(t.createdAt!), 'dd.MM.yyyy', {
                      locale: ru,
                    })}
                  </>
                ) : t.description ? (
                  <span className="line-clamp-1">{t.description}</span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
