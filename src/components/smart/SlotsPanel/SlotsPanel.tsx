import { cn } from '@/lib/utils';
import { getTaskTimeRange } from '@/screens/tasks/_mobile/_calendar/utils/timeRange';
import { Task } from '@/shared/types/task';
import { useMemo, useState } from 'react';

type SlotDuration = 30 | 60;

interface SlotsPanelProps {
  onSelectSlot: (slot: string, duration: SlotDuration) => void;
  tasks: Task[];
  selectedDate: Date;
  selectedSlot?: string | null;
  isLoading?: boolean;
}

const STEP_MINUTES = 30;
const WORK_START_HOUR = 9;
const WORK_END_HOUR = 21;

const MS_MIN = 60_000;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function clampRange(
  r: { start: Date; end: Date },
  min: Date,
  max: Date
): { start: Date; end: Date } | null {
  const start = new Date(Math.max(r.start.getTime(), min.getTime()));
  const end = new Date(Math.min(r.end.getTime(), max.getTime()));
  return start < end ? { start, end } : null;
}

function ceilToStep(date: Date, stepMinutes: number, baseDay: Date) {
  const mins = date.getHours() * 60 + date.getMinutes();
  const rounded = Math.ceil(mins / stepMinutes) * stepMinutes;
  return new Date(baseDay.getTime() + rounded * MS_MIN);
}

function toHHMM(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function SlotsPanel({
  onSelectSlot,
  tasks,
  selectedDate,
  selectedSlot,
  isLoading,
}: SlotsPanelProps) {
  const [duration, setDuration] = useState<SlotDuration | null>(60);

  const activeSlots = useMemo(() => {
    if (!duration) {
      return [];
    }
    if (isLoading) {
      return [];
    }

    const now = new Date();
    const baseDay = startOfDay(selectedDate);
    const isToday = sameDay(baseDay, startOfDay(now));

    const workStart = new Date(baseDay);
    workStart.setHours(WORK_START_HOUR, 0, 0, 0);

    const workEnd = new Date(baseDay);
    workEnd.setHours(WORK_END_HOUR, 0, 0, 0);

    let windowStart = workStart;
    if (isToday) {
      const roundedNow = ceilToStep(now, STEP_MINUTES, baseDay);

      if (roundedNow >= workEnd) {
        return [];
      }
      if (roundedNow > windowStart) {
        windowStart = roundedNow;
      }
    }

    const busyRaw = (tasks ?? [])
      .map((t) => getTaskTimeRange(t))
      .filter(Boolean) as { start: Date; end: Date }[];

    const busyClamped = busyRaw
      .map((r) => clampRange(r, windowStart, workEnd))
      .filter(Boolean) as { start: Date; end: Date }[];

    busyClamped.sort((a, b) => a.start.getTime() - b.start.getTime());

    const merged: { start: Date; end: Date }[] = [];
    for (const b of busyClamped) {
      const last = merged[merged.length - 1];
      if (!last || b.start.getTime() > last.end.getTime()) {
        merged.push({ start: new Date(b.start), end: new Date(b.end) });
      } else if (b.end.getTime() > last.end.getTime()) {
        last.end = new Date(b.end);
      }
    }

    const free: { start: Date; end: Date }[] = [];
    let cursor = new Date(windowStart);

    for (const b of merged) {
      if (b.start.getTime() > cursor.getTime()) {
        free.push({ start: new Date(cursor), end: new Date(b.start) });
      }
      if (b.end.getTime() > cursor.getTime()) {
        cursor = new Date(b.end);
      }
    }
    if (cursor.getTime() < workEnd.getTime()) {
      free.push({ start: new Date(cursor), end: new Date(workEnd) });
    }

    const slots: string[] = [];
    const durMs = duration * MS_MIN;
    const stepMs = STEP_MINUTES * MS_MIN;

    for (const w of free) {
      let start = ceilToStep(w.start, STEP_MINUTES, baseDay);

      if (start.getTime() < windowStart.getTime()) {
        start = new Date(windowStart);
        start = ceilToStep(start, STEP_MINUTES, baseDay);
      }

      while (start.getTime() + durMs <= w.end.getTime()) {
        const end = new Date(start.getTime() + durMs);
        slots.push(`${toHHMM(start)} - ${toHHMM(end)}`);
        start = new Date(start.getTime() + stepMs);
      }
    }

    return slots;
  }, [tasks, selectedDate, duration, isLoading]);

  return (
    <>
      <div className="flex justify-center gap-[33px] py-[8px] text-[12px] tracking-[-0.5px] font-semibold leading-[130%] mb-[19px] mt-[20px] transition-all duration-300">
        <button
          onClick={() => setDuration(duration === 60 ? null : 60)}
          className={cn(
            'relative transition-colors',
            duration === 60 ? 'text-white' : 'text-white/50'
          )}
        >
          60 мин
          {duration === 60 && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full bg-white" />
          )}
        </button>

        <span className="text-white">/</span>

        <button
          onClick={() => setDuration(duration === 30 ? null : 30)}
          className={cn(
            'relative transition-colors',
            duration === 30 ? 'text-white' : 'text-white/50'
          )}
        >
          30 мин
          {duration === 30 && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full bg-white" />
          )}
        </button>
      </div>

      {duration && (
        <div className="grid grid-cols-2 gap-[11px]">
          {activeSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => onSelectSlot(slot, duration)}
              className={cn(
                'h-10 rounded-[4px] border border-[#8AE6FF80] bg-[#8AE6FF1F] text-white text-[16px] font-medium leading-[130%] tracking-[-0.5px]',
                selectedSlot === slot && 'bg-[#517e8a1f] ui-glow'
              )}
            >
              {slot}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
