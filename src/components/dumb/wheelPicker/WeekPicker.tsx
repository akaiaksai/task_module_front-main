// src/components/dumb/wheelPicker/WeekPicker.tsx
import { addDays, format, isSameDay, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

interface WeekPickerProps {
  /** Выбранная дата */
  selectedDate: Date;
  /** Callback при выборе даты */
  onDateSelect: (date: Date) => void;
}

/**
 * Компонент выбора дня недели
 * Отображает 7 дней начиная с сегодняшнего дня
 * Сохраняет выбранную дату в query параметре
 */
export function WeekPicker({ selectedDate, onDateSelect }: WeekPickerProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Генерируем массив из 7 дней начиная с сегодня
  const weekDays = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => addDays(today, i));
  }, []);

  // Синхронизация выбранной даты с query параметром при монтировании
  useEffect(() => {
    const dateParam = searchParams.get('date');

    if (dateParam) {
      // Если есть дата в query, используем её
      try {
        const parsedDate = parseISO(dateParam);
        if (!isSameDay(parsedDate, selectedDate)) {
          onDateSelect(parsedDate);
        }
      } catch (error) {
        console.error('Ошибка парсинга даты из query:', error);
        // Если не удалось распарсить, устанавливаем текущую дату в query
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('date', format(selectedDate, 'yyyy-MM-dd'));
        setSearchParams(newSearchParams, { replace: true });
      }
    } else {
      // Если в query нет даты, записываем туда текущую выбранную дату
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('date', format(selectedDate, 'yyyy-MM-dd'));
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, selectedDate, onDateSelect, setSearchParams]);

  // Обработчик выбора даты
  const handleDateSelect = (date: Date) => {
    // Обновляем дату через callback
    onDateSelect(date);

    // Обновляем query параметр
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('date', format(date, 'yyyy-MM-dd'));
    setSearchParams(newSearchParams, { replace: true });
  };

  // Форматируем день недели (первые 2 буквы)
  const formatDayOfWeek = (date: Date) =>
    format(date, 'EEE', { locale: ru })
      .slice(0, 2)
      .replace(/^./, (c) => c.toUpperCase());

  const selectedClasses = `border border-[rgba(138,230,255,0.5)] backdrop-blur-[100px] font-semibold text-white shadow-[0_0_0.92px_rgba(0,0,0,0.29), 0_1.83px_1.83px_rgba(0,0,0,0.26), 0_3.66px_1.83px_rgba(0,0,0,0.15), 0_5.49px_2.75px_rgba(0,0,0,0.04), 0_9.15px_2.75px_rgba(0,0,0,0.02), 0_0_10px_rgba(51,193,231,0.4)]`;

  return (
    <div className="flex justify-around p-2  rounded-full">
      {weekDays.map((day) => {
        const isSelected = isSameDay(day, selectedDate);

        return (
          <button
            key={day.toISOString()}
            className={`flex flex-col items-center justify-center font-normal rounded-full w-12 h-12 bg-[#8AE6FF26]
  backdrop-blur-md transition-colors ${
    isSelected ? selectedClasses : 'text-white'
  }`}
            onClick={() => handleDateSelect(day)}
            aria-label={`Выбрать ${format(day, 'd MMMM', { locale: ru })}`}
          >
            <div className="text-[12.82px] tracking-[-0.46px] leading-[130%]">
              {format(day, 'd')}
            </div>
            <div className="text-[12.82px] tracking-[-0.46px] leading-[130%]">
              {formatDayOfWeek(day)}
            </div>
          </button>
        );
      })}
    </div>
  );
}
