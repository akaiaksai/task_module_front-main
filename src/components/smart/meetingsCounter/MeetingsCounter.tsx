// src/components/smart/mobileHeader/MeetingsCounter.tsx
import { format } from 'date-fns';
import { ChevronDown } from 'lucide-react';

interface MeetingsCounterProps {
  /** Количество встреч */
  count: number;
  /** Выбранная дата */
  selectedDate: Date;
  /** Открыт ли календарь */
  isOpen: boolean;
  /** Callback при клике */
  onToggle: () => void;
}

/**
 * Компонент отображения количества встреч на выбранную дату
 * С возможностью раскрыть/свернуть календарь
 */
export function MeetingsCounter({
  count,
  selectedDate,
  isOpen,
  onToggle,
}: MeetingsCounterProps) {
  return (
    <div
      className="flex items-center justify-between p-3 bg-white cursor-pointer transition-colors"
      onClick={onToggle}
      role="button"
      aria-expanded={isOpen}
      aria-label={`Встречи на ${format(
        selectedDate,
        'dd.MM.yyyy'
      )}, ${count} встреч${count === 1 ? 'а' : count < 5 ? 'и' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="bg-[#0EA7A8] text-white rounded-lg px-2 py-1 text-xs min-w-6 h-6 flex items-center justify-center font-semibold">
          {count}
        </span>
        <span className="font-semibold text-gray-800">
          Встречи на {format(selectedDate, 'dd.MM.yyyy')}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>
    </div>
  );
}
