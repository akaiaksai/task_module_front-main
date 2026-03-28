import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarNavigationProps {
  currentDate?: Date;

  viewMode?: 'month' | 'week' | 'day';
  onChange?: (date: Date) => void;

  label?: string;

  className?: string;
  buttonClassName?: string;
  labelClassName?: string;

  onPrev?: () => void;
  onNext?: () => void;
}

export function CalendarNavigation({
  currentDate,
  viewMode,
  onChange,
  label,

  className = '',
  buttonClassName = '',
  labelClassName = '',

  onPrev,
  onNext,
}: CalendarNavigationProps) {
  const navigate = (dir: 'prev' | 'next') => {
    if (dir === 'prev' && onPrev) {
      return onPrev();
    }
    if (dir === 'next' && onNext) {
      return onNext();
    }

    if (!currentDate || !viewMode || !onChange) {
      return;
    }

    const newDate = new Date(currentDate);

    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + (dir === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (dir === 'next' ? 7 : -7));
    } else {
      newDate.setDate(currentDate.getDate() + (dir === 'next' ? 1 : -1));
    }

    onChange(newDate);
  };

  return (
    <div
      className={`
        flex items-center gap-2 
        w-[200px] flex-1 justify-center 
        ${className}
      `}
    >
      <button
        className={`
          p-1 rounded-lg hover:bg-gray-50
          flex items-center justify-center
          text-[#666666] hover:text-gray-900
          transition-colors
          ${buttonClassName}
        `}
        onClick={() => navigate('prev')}
      >
        <ChevronLeft className="h-3 w-3" />
      </button>

      <div
        className={`
          ${labelClassName}
        `}
      >
        {label}
      </div>

      <button
        className={`
          p-1 rounded-lg hover:bg-gray-50
          flex items-center justify-center
          text-[#666666] hover:text-gray-900
          transition-colors
          ${buttonClassName}
        `}
        onClick={() => navigate('next')}
      >
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}
