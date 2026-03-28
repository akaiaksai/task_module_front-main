import { getDisplayName } from '@/hooks/groups/useGroupsAndMembers';
import { UserAvatar } from '../UserAvatar';
import { getOccupancyColor } from '@/utils/occupancyCalculator';

interface UserHeaderProps {
  user: ANY;
  tasks?: ANY[];
  currentDate?: Date;
  occupancy?: {
    percentage: number;
    estimatedHours: number;
    elapsedHours: number;
  } | null;
}

export function UserHeader({
  user,
  // tasks,
  // currentDate,
  occupancy,
}: UserHeaderProps) {
  const userName = getDisplayName(user);

  return (
    <div className="flex items-center justify-between space-x-3 mb-[10px] lg:mb-[6.11px] w-[400px] sm:w-[244.44px]">
      <div className="flex items-center gap-3 lg:gap-[7.33px] min-w-0">
        <div className="lg:hidden">
          <UserAvatar user={user} />
        </div>
        <div className="hidden lg:block">
          <UserAvatar user={user} size="sm" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-normal text-black text-[13.89px] lg:text-[16px] truncate leading-[130%] tracking-[-0.39px] text-nowrap">
              {userName}
            </span>
          </div>
        </div>
      </div>

      {occupancy && (
        <div
          className={`
            text-[13.89px] lg:text-[16px] flex items-center justify-center font-normal tracking-[-0.39px] rounded-[24px] border whitespace-nowrap px-[4px]
            ${getOccupancyColor(occupancy.percentage)}
          `}
          title={`${occupancy.percentage}% — ${occupancy.elapsedHours}ч из ${occupancy.estimatedHours}ч`}
        >
          {Math.round(occupancy.percentage)}%
        </div>
      )}
    </div>
  );
}
