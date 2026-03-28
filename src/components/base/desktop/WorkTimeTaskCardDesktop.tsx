import React from 'react';
import { TimerIcon } from '@/components/icons/timerIcon';
import { SandClock } from '@/components/icons/sandClock';

interface WorkTimeTaskCardDesktopProps {
  title: string;
  planned: number;
  spent: number;
  isRunning: boolean;
  isCompleted: boolean;
  isRenewing: boolean;
  onToggle: () => void;
  onFinish: () => void;
  onRenew: () => void;
}

export const WorkTimeTaskCardDesktop: React.FC<
  WorkTimeTaskCardDesktopProps
> = ({
  title,
  planned,
  spent,
  isRunning,
  isCompleted,
  isRenewing,
  onToggle,
  onFinish,
  onRenew,
}) => {
  const remaining = planned - spent;

  return (
    <div className="bg-[#8AE6FF1F] border-[1.5px] border-[#8AE6FF80] text-white rounded-[12px] px-[11.58px] pt-[7.72px] pb-[10.81px] w-[206px] mb-[24px]">
      <div className="flex items-center gap-2 mb-3">
        <TimerIcon />
        <span className="font-normal text-[13.89px] leading-[130%] tracking-[-0.39px] underline truncate">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[12px] leading-[130%] tracking-[-0.68px] mb-[10.81px]">
        <span className="flex items-center gap-1">
          <SandClock
            width={10.34}
            height={14.93}
            stroke="white"
            className="translate-y-[-1px]"
          />{' '}
          {planned} мин
        </span>
        -<span className="underline"> {spent} мин</span>
        <span>=</span>
        <span>{remaining} мин</span>
      </div>

      <div className="flex items-center gap-2">
        {!isCompleted ? (
          <>
            <button
              onClick={onToggle}
              className="bg-[#53C41A] hover:bg-[#34A23B] shadow-soft transition-colors text-white px-[7px] py-[3.09px] rounded-[3.09px] text-[10.81px] leading-[130%] tracking-[-0.39px]"
            >
              {isRunning ? 'На паузу' : 'Продолжить'}
            </button>

            <button
              onClick={onFinish}
              className="bg-white text-black px-[7px] py-[3.09px] shadow-soft rounded-[3.09px] text-[10.81px] leading-[130%] tracking-[-0.39px] hover:bg-gray-200 transition-colors"
            >
              Завершить
            </button>
          </>
        ) : (
          <button
            onClick={onRenew}
            disabled={isRenewing}
            className={`bg-white text-black px-[7px] py-[3.09px] rounded-[3.09px] text-[10.81px] leading-[130%] tracking-[-0.39px] transition-colors ${
              isRenewing ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-200'
            }`}
          >
            {isRenewing ? 'Возобновление...' : 'Возобновить'}
          </button>
        )}
      </div>
    </div>
  );
};
