import { Task } from '@/shared/types/task';
import { getTaskTimeRange } from './timeRange';

export interface PositionedTask extends Task {
  top: number;
  height: number;
  left: number;
  width: number;
  _realStart: number;
  _realEnd: number;
  isMain?: boolean;
  isMulti?: boolean;
  partialInside?: boolean;
  parentBig?: string | null;
  zIndex?: number;
}

interface DayCalcResult {
  top: number;
  height: number;
}

const calculateTaskPositionInDay = (
  task: Task,
  day: Date,
  startHour: number,
  endHour: number,
  hourHeight: number,
  visibleHours: number,
  offsetMinutes: number
): DayCalcResult | null => {
  const range = getTaskTimeRange(task);
  if (!range) {
    return null;
  }

  const calendarStart = new Date(day);
  calendarStart.setHours(startHour, 0, 0, 0);
  const calendarEnd = new Date(day);
  calendarEnd.setHours(endHour, 0, 0, 0);

  if (range.end <= calendarStart || range.start >= calendarEnd) {
    return null;
  }

  const start = Math.max(range.start.getTime(), calendarStart.getTime());
  const end = Math.min(range.end.getTime(), calendarEnd.getTime());

  const fullMinutes = (endHour - startHour) * 60;
  const pxPerMin = (visibleHours * hourHeight) / fullMinutes;

  let startMin = (start - calendarStart.getTime()) / 60000 + offsetMinutes;
  let endMin = (end - calendarStart.getTime()) / 60000 + offsetMinutes;

  startMin = Math.max(0, Math.min(fullMinutes, startMin));
  endMin = Math.max(0, Math.min(fullMinutes, endMin));

  let top = startMin * pxPerMin;
  let height = (endMin - startMin) * pxPerMin;

  if (height < 30) {
    height = 30;
    top = endMin * pxPerMin - height;
  }

  return { top, height };
};

export const calculateTaskPositions = (
  tasks: Task[],
  day: Date,
  startHour: number,
  endHour: number,
  hourHeight: number,
  visibleHours: number,
  offsetMinutes: number
): PositionedTask[] => {
  const items = tasks
    .map((t) => {
      const range = getTaskTimeRange(t);
      if (!range) {
        return null;
      }

      const pos = calculateTaskPositionInDay(
        t,
        day,
        startHour,
        endHour,
        hourHeight,
        visibleHours,
        offsetMinutes
      );
      if (!pos) {
        return null;
      }

      return {
        ...t,
        top: pos.top,
        height: pos.height,
        _realStart: range.start.getTime(),
        _realEnd: range.end.getTime(),
        left: 0,
        width: 100,
        parentBig: null,
      };
    })
    .filter(Boolean) as PositionedTask[];

  if (!items.length) {
    return [];
  }

  const BIG_H = hourHeight * 4;

  const bigTasks = items.filter((t) => t.height >= BIG_H);
  const smallTasks = items.filter((t) => t.height < BIG_H);

  function overlaps(a: PositionedTask, b: PositionedTask) {
    return !(a._realEnd <= b._realStart || b._realEnd <= a._realStart);
  }

  bigTasks.sort((a, b) => a._realStart - b._realStart);

  const columns: PositionedTask[][] = [];

  for (const big of bigTasks) {
    let placed = false;

    for (const col of columns) {
      const last = col[col.length - 1];
      if (!overlaps(last, big)) {
        col.push(big);
        placed = true;
        break;
      }
    }

    if (!placed) {
      columns.push([big]);
    }
  }

  const colWidth = 100 / columns.length;

  columns.forEach((col, idx) => {
    col.forEach((big) => {
      big.left = idx * colWidth;
      big.width = colWidth;
      big.isMain = true;
      big.isMulti = false;
    });
  });

  const partial: PositionedTask[] = [];
  const pureSmall: PositionedTask[] = [];

  for (const small of smallTasks) {
    let isPartial = false;

    for (const big of bigTasks) {
      const startsInside =
        small._realStart >= big._realStart && small._realStart <= big._realEnd;

      const endsOutside = small._realEnd > big._realEnd;

      if (startsInside && endsOutside) {
        isPartial = true;
        small.partialInside = true;
        partial.push(small);
        break;
      }
    }

    if (!isPartial) {
      pureSmall.push(small);
    }
  }

  const insideMap = new Map<PositionedTask, PositionedTask[]>();
  bigTasks.forEach((b) => insideMap.set(b, []));

  function fitsInside(big: PositionedTask, small: PositionedTask) {
    return small._realStart >= big._realStart && small._realEnd <= big._realEnd;
  }

  const inside: PositionedTask[] = [];
  let rr = 0;

  for (const s of pureSmall) {
    const parents = bigTasks.filter((b) => fitsInside(b, s));
    if (!parents.length) {
      continue;
    }

    const chosen = parents[rr % parents.length];
    rr++;

    insideMap.get(chosen)!.push(s);
    s.parentBig = chosen.id!.toString();
    inside.push(s);
  }

  for (const big of bigTasks) {
    const children = insideMap.get(big)!;
    if (!children.length) {
      continue;
    }

    children.sort((a, b) => a._realStart - b._realStart);

    const overlapGroups: PositionedTask[][] = [];

    for (const child of children) {
      let placed = false;

      for (const group of overlapGroups) {
        const anyOverlap = group.some(
          (g) =>
            !(child._realEnd <= g._realStart || child._realStart >= g._realEnd)
        );
        if (anyOverlap) {
          group.push(child);
          placed = true;
          break;
        }
      }

      if (!placed) {
        overlapGroups.push([child]);
      }
    }

    overlapGroups.forEach((group) => {
      const n = group.length;
      const GAP = 3;
      const usableWidth = big.width - GAP;
      const w = usableWidth / n;

      group.forEach((child, i) => {
        child.left = big.left + GAP + w * i;
        child.width = w;

        child.isMain = false;
        child.isMulti = n > 1;
      });
    });
  }

  const firstBig = bigTasks[0];

  if (firstBig && partial.length > 0) {
    const GAP = 3;
    const usableWidth = firstBig.width - GAP;
    const n = partial.length;
    const w = usableWidth / n;

    partial.forEach((p, idx) => {
      p.left = firstBig.left + GAP + idx * w;
      p.width = w;
      p.zIndex = 5000;
      p.isMain = false;
      p.isMulti = n > 1;
    });
  }

  const freeSmall = smallTasks.filter(
    (s) => !inside.includes(s) && !partial.includes(s)
  );

  const grouped = new Map<number, PositionedTask[]>();
  const T30 = 30 * 60000;

  for (const t of freeSmall) {
    const key = Math.round(t._realStart / T30);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(t);
  }

  const freePlaced: PositionedTask[] = [];

  [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .forEach(([, group]) => {
      const top = Math.min(...group.map((t) => t.top));

      group.sort((a, b) => b.height - a.height);

      const n = group.length;
      group.forEach((t, i) => {
        t.top = top;
        t.left = (i / n) * 100;
        t.width = 100 / n;
        t.isMain = i === 0;
        t.isMulti = n > 1;

        freePlaced.push(t);
      });
    });

  const result = [...bigTasks, ...inside, ...freePlaced, ...partial];

  result.forEach((task) => {
    if (!task.zIndex) {
      task.zIndex = task._realStart;
    }
  });

  return result.sort((a, b) => a._realStart - b._realStart);
};
