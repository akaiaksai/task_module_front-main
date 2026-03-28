// src/components/smart/meetingCalendar/MeetingCard.tsx

/**
 * Компонент карточки встречи
 */

import { Task } from '@/shared/types/task';
import { useUIStore } from '@/store/ui';
import { calculateMeetingStatus } from '@/utils/calculateMeetingStatus';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGroupColor } from '../../../screens/tasks/_mobile/_calendar/utils/colors';

interface MeetingCardProps {
  task: Task;
  isLast: boolean;
  showTime?: boolean;
  // Новые пропсы для группы
  isGroupHeader?: boolean;
  groupCount?: number;
  isExpanded?: boolean;
  onToggleGroup?: () => void;
  taskType?: 'meeting' | 'task';
  showLeftLine?: boolean;
}

/**
 * Карточка отдельной встречи с информацией о времени и статусом
 */

export function MeetingCard({
  task,
  isLast,
  showTime = true,
  isGroupHeader = false,
  groupCount = 0,
  isExpanded = false,
  onToggleGroup,
  taskType = 'meeting',
  showLeftLine = true,
}: MeetingCardProps) {
  const navigate = useNavigate();
  const { setIsCalendarOpen } = useUIStore();

  const cardStatus = useMemo(() => {
    if (task.groupId !== undefined) {
      const groupColor = getGroupColor(task.groupId!);
      const backgroundColor = groupColor.bg;
      const textColor = groupColor.border;
      return {
        backgroundColor,
        textColor,
        borderColor: groupColor.border,
      };
    }
    return calculateMeetingStatus(task.dueDate ?? null);
  }, [task.dueDate, task.groupId]);

  const handleClick = () => {
    setIsCalendarOpen(false);
    navigate(`/tasks/${task.id}`);
  };

  const formattedTime = task.dueDate
    ? format(parseISO(task.dueDate), 'HH:mm', { locale: ru })
    : '';
  const formattedDate = task.dueDate
    ? format(parseISO(task.dueDate), 'dd.MM.yy', { locale: ru })
    : '';
  const formattedTimeEstimate = task.timeEstimate
    ? `${Math.round(task.timeEstimate / 60)} мин`
    : '';

  return (
    <div
      className={`flex gap-3 mb-3 px-3 ${
        showLeftLine ? 'pl-14' : 'pl-24'
      } relative`}
    >
      {/* Левая колонка с временем и линией (только для задач с временем) */}
      {showLeftLine && (
        <div className="flex flex-col items-center relative pt-4">
          <div className="flex items-center">
            {showTime && (
              <div className="text-xs absolute right-6 font-medium text-gray-700 whitespace-nowrap">
                {formattedTime}
              </div>
            )}
            <div
              className="w-3 h-3 rounded-full border z-10 flex-shrink-0"
              style={{
                backgroundColor:
                  task.groupId !== undefined
                    ? cardStatus.backgroundColor
                    : 'white',
                borderColor:
                  task.groupId !== undefined
                    ? cardStatus.backgroundColor
                    : '#D1D5DB',
                borderWidth: '2px',
              }}
            />
          </div>
          {!isLast && (
            <div className="w-0.5 bg-gray-300 h-[calc(100%+0.5rem)] absolute top-8 bottom-0" />
          )}
        </div>
      )}

      {/* Основное содержимое карточки */}
      <div
        onClick={handleClick}
        className={`flex-1 min-w-0 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg border ${
          !showLeftLine ? 'ml-0' : ''
        }`}
        style={{
          backgroundColor: cardStatus.backgroundColor,
          borderColor: cardStatus.backgroundColor,
        }}
      >
        {/* TITLE LOGIC */}
        {taskType === 'task' ? (
          <div
            className="font-semibold text-xs mb-2"
            style={{ color: cardStatus.textColor }}
          >
            {task.title}
          </div>
        ) : (
          <div className="font-semibold text-xs mb-2">
            {task.dueDate ? (
              <>
                Встреча {formattedDate} - {formattedTime}
              </>
            ) : (
              <>Встреча без времени</>
            )}
          </div>
        )}

        {/* DESCRIPTION */}
        {taskType === 'meeting' && (
          <div className="text-[0.625rem] mb-2 font-normal line-clamp-2">
            {task.title}
          </div>
        )}

        <div
          className="w-[50%] h-[0.2px] mb-2"
          style={{ backgroundColor: cardStatus.textColor, opacity: 0.3 }}
        />

        {formattedTimeEstimate && (
          <div className="flex items-center gap-1 font-normal text-[0.625rem]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 2H18M6 22H18M18 2V7C18 7 15 12 12 12C9 12 6 7 6 7V2M18 22V17C18 17 15 12 12 12C9 12 6 17 6 17V22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Заявлено {formattedTimeEstimate}</span>
          </div>
        )}

        {taskType === 'task' && task.dueDate && (
          <div className="text-[0.625rem] font-medium mt-3 text-right opacity-80">
            Срок: {formattedDate} {formattedTime}
          </div>
        )}

        {isGroupHeader && groupCount > 1 && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleGroup?.();
            }}
            className="flex items-center justify-between mt-2 pt-2 cursor-pointer"
            style={{
              borderColor: cardStatus.textColor,
              borderTopWidth: '1px',
            }}
          >
            <span className="text-xs">
              {isExpanded
                ? 'Скрыть'
                : `Еще ${groupCount - 1} задач на это время`}
            </span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        )}
      </div>
    </div>
  );
}
