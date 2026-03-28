import { formatTime } from '@/utils/time';
import { useTimeman } from '@/hooks/timeman/useTimeman';

interface TimemanHeaderTimerProps {
  onOpenDropdown: () => void;
}

export const TimemanHeaderTimer = ({
  onOpenDropdown,
}: TimemanHeaderTimerProps) => {
  const { status, elapsedTime } = useTimeman();

  if (status !== 'opened') {
    return null;
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
      onClick={onOpenDropdown}
      title="Нажмите для открытия управления рабочим днем"
    >
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-sm font-mono text-green-800">
        {formatTime(elapsedTime)}
      </span>
    </div>
  );
};
