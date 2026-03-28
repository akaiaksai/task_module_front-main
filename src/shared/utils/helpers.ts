import { HasTimeEstimate } from '@/shared/types/time';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

// Вспомогательные функции для обработки данных
const safeFormatDate = (
  dateString: string | null | undefined,
  formatStr: string
): string => {
  if (!dateString) {
    return '—';
  }
  try {
    return format(parseISO(dateString), formatStr, { locale: ru });
  } catch {
    return '—';
  }
};

const getStringValue = (value: ANY): string | undefined => {
  if (!value) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    // Обработка объектов типа {Int64, Valid}
    if (value.String !== undefined) {
      return value.String;
    }
    if (value.Int64 !== undefined) {
      return value.Int64.toString();
    }
    if (value.Valid !== undefined) {
      // Если Valid false, возвращаем undefined
      if (!value.Valid) {
        return undefined;
      }
      // Ищем любое другое поле с данными
      const keys = Object.keys(value).filter((key) => key !== 'Valid');
      if (keys.length > 0 && value[keys[0]] !== undefined) {
        return value[keys[0]].toString();
      }
    }
  }
  return undefined;
};

const getNumberValue = (value: ANY): number | null => {
  if (!value) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'object') {
    // Обработка объектов типа {Int64, Valid}
    if (value.Int64 !== undefined) {
      return Number(value.Int64);
    }
    if (value.Valid !== undefined && value.Valid) {
      const keys = Object.keys(value).filter((key) => key !== 'Valid');
      if (keys.length > 0 && value[keys[0]] !== undefined) {
        return Number(value[keys[0]]);
      }
    }
  }
  return null;
};

function getRemainingMinutes(task: HasTimeEstimate, elapsedMin: number) {
  const totalPlanMin = task.timeEstimate
    ? Math.round(task.timeEstimate / 60)
    : 0;

  return {
    totalPlanMin,
    elapsedMin,
    remainingMin: Math.max(totalPlanMin - elapsedMin, 0),
  };
}

function formatBitrixDate(isoString: string) {
  if (!isoString) {
    return { date: '', time: '' };
  }

  const dateObj = new Date(isoString);

  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();

  const hh = String(dateObj.getHours()).padStart(2, '0');
  const min = String(dateObj.getMinutes()).padStart(2, '0');

  return {
    date: `${dd}.${mm}.${yyyy}`,
    time: `${hh}:${min}`,
  };
}

function localDateTimeToUTC(dateStr: string, timeStr: string) {
  const [dd, mm, yyyy] = dateStr.split('.');
  const [hh, min] = timeStr.split(':');

  const local = new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(min)
  );

  return local.toISOString();
}

function utcToLocal(iso: string) {
  const d = new Date(iso);

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();

  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');

  return {
    date: `${dd}.${mm}.${yyyy}`,
    time: `${hh}:${min}`,
  };
}

function parseBitrixDate(value: ANY): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === 'object' && 'String' in value) {
    const s = value.String;
    if (!s) {
      return null;
    }

    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function sumElapsedMinutes(elapsed: ANY[]): number {
  if (!elapsed || !Array.isArray(elapsed)) {
    return 0;
  }
  return Math.round(
    elapsed.reduce((acc, item) => acc + (item.Seconds ?? 0), 0) / 60
  );
}

function getPriorityColor(priority: number) {
  if (priority <= 4) {
    return 'bg-[#53C41A]';
  }
  if (priority <= 7) {
    return 'bg-[#E5B702]';
  }
  return 'bg-[#EF4642]';
}

function getTimeColor(totalHours: number) {
  if (totalHours <= 20) {
    return 'bg-[#53C41A]';
  }
  if (totalHours <= 60) {
    return 'bg-[#E5B702]';
  }
  return 'bg-[#EF4642]';
}

function formatHMS(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function formatHM(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export {
  formatBitrixDate,
  formatHM,
  formatHMS,
  getNumberValue,
  getPriorityColor,
  getRemainingMinutes,
  getStringValue,
  getTimeColor,
  localDateTimeToUTC,
  parseBitrixDate,
  safeFormatDate,
  sumElapsedMinutes,
  utcToLocal,
};
