// screens/tasks/TaskView.tsx
import { DateTimeInput } from '@/components/smart/DateTimeInput';
import { updateTask } from '@/lib/api/tasks/tasks';
import {
  localDateTimeToUTC,
  parseBitrixDate,
  utcToLocal,
} from '@/shared/utils/helpers';
import { WindowCard } from '@components/dumb/WindowCard';
import { useQueryClient } from '@tanstack/react-query';
import { Hourglass } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const PlanningBlock = ({
  task,
  onClose,
}: {
  task: ANY;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const created = parseBitrixDate(task.createdAt);
  const [dirty, setDirty] = useState(false);

  const createdDate = created ? created.toLocaleDateString('ru-RU') : '—';
  const createdTime = created
    ? created.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  const deadline = task.dueDate ? utcToLocal(task.dueDate) : null;

  const [deadlineDate, setDeadlineDate] = useState(deadline?.date);
  const [deadlineTime, setDeadlineTime] = useState(deadline?.time);

  // Состояние для планируемого времени
  const plannedSeconds = task.timeEstimate ?? 0;
  const [plannedHours, setPlannedHours] = useState(
    Math.floor(plannedSeconds / 3600)
  );
  const [plannedMinutes, setPlannedMinutes] = useState(
    Math.floor((plannedSeconds % 3600) / 60)
  );

  async function savePlanning() {
    const payload: ANY = {};

    if (deadlineDate && deadlineTime) {
      payload.DEADLINE = localDateTimeToUTC(deadlineDate, deadlineTime);
    }

    payload.TIME_ESTIMATE = plannedHours * 3600 + plannedMinutes * 60;

    try {
      await updateTask(task.id, payload);

      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      queryClient.setQueriesData(
        {
          predicate: (q) =>
            Array.isArray(q.queryKey) && q.queryKey[0] === 'tasks',
        },
        (old: ANY) => {
          if (!old?.items) {
            return old;
          }

          return {
            ...old,
            items: old.items.map((t: ANY) =>
              String(t.id) === String(task.id)
                ? {
                    ...t,
                    dueDate: payload.DEADLINE ?? t.dueDate,
                    timeEstimate: payload.TIME_ESTIMATE ?? t.timeEstimate,
                  }
                : t
            ),
          };
        }
      );

      toast.success('Планирование обновлено');
    } catch (e) {
      console.error('Ошибка обновления планирования:', e);
      toast.error('Не удалось сохранить изменения');
    }
  }

  // Debounce для сохранения - вызывается через 1 секунду после последнего изменения
  useEffect(() => {
    if (!dirty) {
      return;
    }

    const timer = setTimeout(() => {
      savePlanning();
      setDirty(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [deadlineDate, deadlineTime, plannedHours, plannedMinutes, dirty]);

  const [redlineDate, setRedlineDate] = useState('22.10.2025');
  const [redlineTime, setRedlineTime] = useState('19:40');

  const limitTwoDigits = (val: string) => {
    return val.replace(/\D/g, '').slice(0, 2);
  };

  const [plannedHoursRaw, setPlannedHoursRaw] = useState(
    String(Math.floor(plannedSeconds / 3600)).padStart(2, '0')
  );
  const [plannedMinutesRaw, setPlannedMinutesRaw] = useState(
    String(Math.floor((plannedSeconds % 3600) / 60)).padStart(2, '0')
  );

  const handleHoursChange = (val: string) => {
    const limited = limitTwoDigits(val);
    setPlannedHoursRaw(limited); // Сохраняем как есть, без добавления '00'

    const num = limited === '' ? 0 : parseInt(limited);
    setPlannedHours(Math.min(num, 99));
    setDirty(true);
  };

  const handleMinutesChange = (val: string) => {
    const limited = limitTwoDigits(val);
    setPlannedMinutesRaw(limited); // Сохраняем как есть, без добавления '00'

    const num = limited === '' ? 0 : parseInt(limited);
    setPlannedMinutes(Math.min(num, 59));
    setDirty(true);
  };

  return (
    <WindowCard
      titleClassName="text-white"
      title="Планирование времени"
      onClose={onClose}
    >
      <div className="space-y-4">
        <DateTimeInput
          label="Начало"
          valueDate={createdDate}
          valueTime={createdTime}
          readOnly
        />

        <div className="flex items-center justify-between">
          <span className="text-[14px] text-[#2B2B2B">Выполнение</span>

          <div className="flex items-center border rounded-xl px-2 py-2">
            <Hourglass className="w-4 h-4 text-[#D9A300]" />

            <input
              type="text"
              inputMode="numeric"
              value={plannedHoursRaw}
              onChange={(e) => handleHoursChange(e.target.value)}
              onBlur={() =>
                setPlannedHoursRaw(String(plannedHours).padStart(2, '0'))
              }
              className="w-[32px] h-[25px] bg-white border-0 border-b border-[#2B2B2B66] outline-none focus:border-[#2B2B2B] text-center text-[16px] font-normal text-[#2B2B2B]"
            />
            <span className="text-[14px]">часов</span>

            <input
              type="text"
              inputMode="numeric"
              value={plannedMinutesRaw}
              onChange={(e) => handleMinutesChange(e.target.value)}
              onBlur={() =>
                setPlannedMinutesRaw(String(plannedMinutes).padStart(2, '0'))
              }
              className="w-[32px] h-[25px] border-0 border-b border-[#2B2B2B66] outline-none focus:border-[#2B2B2B] text-center text-[16px] font-normal text-[#2B2B2B]"
            />
            <span className="text-[14px]">минут</span>
          </div>
        </div>

        <div className="w-full h-[1px] bg-[#E6E6E6]" />

        <DateTimeInput
          label="Крайний срок"
          valueDate={deadlineDate || ''}
          valueTime={deadlineTime || ''}
          onChange={(d, t) => {
            setDeadlineDate(d);
            setDeadlineTime(t);
            setDirty(true);
          }}
        />

        <DateTimeInput
          label="Ред-Лайн"
          valueDate={redlineDate}
          valueTime={redlineTime}
          onChange={(d, t) => {
            setRedlineDate(d);
            setRedlineTime(t);
            console.log('Redline changed:', d, t);
          }}
        />
      </div>
    </WindowCard>
  );
};
