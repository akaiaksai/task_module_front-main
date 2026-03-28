import React from 'react';
import { TimerIcon } from '@/components/icons/timerIcon';
import { SandClock } from '@/components/icons/sandClock';

interface WorkTimeTaskCardMobileProps {
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

export const WorkTimeTaskCardMobile: React.FC<WorkTimeTaskCardMobileProps> = ({
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
    <div className="bg-mobile-header text-white rounded-[12px] px-[15px] py-[10px] mb-[20px]">
      <div className="flex items-center gap-2 mb-[7.47px]">
        <TimerIcon />
        <span className="font-normal text-[18px] leading-[130%] tracking-[-0.39px] underline truncate">
          {title}
        </span>
      </div>

      <div className="flex items-center gap-2 text-[14px] font-normal tracking-[-0.68px] mb-[7.47px]">
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
              className="bg-white transition-colors text-black px-[8px] py-[4px] rounded-[4px] text-[14px] leading-[130%] tracking-[-0.5px]"
            >
              {isRunning ? 'На паузу' : 'Продолжить'}
            </button>

            <button
              onClick={onFinish}
              className="bg-white transition-colors text-black px-[8px] py-[4px] rounded-[4px] text-[14px] leading-[130%] tracking-[-0.5px]"
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
