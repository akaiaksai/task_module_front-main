import { useMemo } from 'react';

interface DateButtonProps {
  mode: 'month' | 'week' | 'day';
  currentDate: Date;
  onClick: () => void;
  className?: string;
}

export function DateButton({ mode, onClick, className = '' }: DateButtonProps) {
  const label = useMemo(() => {
    if (mode === 'month') {
      return 'Этот месяц';
    }
    if (mode === 'week') {
      return 'Эта неделя';
    }
    return 'Сегодня';
  }, [mode]);

  return (
    <button
      onClick={onClick}
      className={`
        py-[6px] 
        text-[#ECE9E7] 
        hover:text-[#ece9e7cb]
        text-[14px]
        font-normal
        leading-[130%]
        tracking-[-0.83px]
        transition-colors
        ${className}
      `}
    >
      {label}
    </button>
  );
}
