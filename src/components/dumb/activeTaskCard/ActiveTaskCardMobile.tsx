import { ChevronRightIcon } from 'lucide-react';
import { StatusCircle } from '@/components/icons/statusCircle';
import { SandClock } from '@/components/icons/sandClock';
import { Pause } from '@/components/icons/pauseIcon';
import { VideoCountIcon } from '@/components/icons/videoCount';
import { ImagesCountIcon } from '@/components/icons/ImagesCount';
import { UserAvatar } from '@/screens/groups/UserAvatar';
import Button from '@/ui/Button';
import { formatTimeHMS } from '@/utils/time';
import { getStringValue, safeFormatDate } from '@/shared/utils/helpers';
import { getTaskTimeStatus } from '@/screens/tasks/_mobile/_calendar/utils/taskStatus';

interface ActiveTaskCardMobileProps {
  task: ANY;
  elapsedMs: number;
  plannedMs: number;
  assignee?: ANY;
  createdBy?: ANY;
  previewImage?: {
    downloadUrl: string;
    name?: string;
  };
  onPause?: () => void;
  onComplete?: () => void;
  hideActions?: boolean;
}

export const ActiveTaskCardMobile = ({
  task,
  elapsedMs,
  plannedMs,
  assignee,
  createdBy,
  previewImage,
  onPause,
  onComplete,
  hideActions,
}: ActiveTaskCardMobileProps) => {
  const elapsedSec = Math.floor(elapsedMs / 1000);
  const timeStatus = getTaskTimeStatus(task, elapsedSec);
  const stats = task?.fileStats;

  return (
    <div
      className={`bg-[#192A33] rounded-[3.43px] px-[7.73px] h-[231px] py-[8.59px] ${hideActions ? 'w-[184px]' : 'w-[167.42px]'}`}
    >
      <div className="flex items-center gap-1 mb-[6.87px]">
        {timeStatus?.display && (
          <StatusCircle
            color={timeStatus.statusColor!}
            className="shrink-0 translate-y-[-1.5px]"
            height={10.46}
            width={10.46}
          />
        )}
        <div
          className={`font-normal leading-[130%] tracking-[-0.43px] ${hideActions ? 'text-[12px]' : 'text-[10.3px]'}`}
        >
          {timeStatus?.status ?? 'Без статуса'}{' '}
          {safeFormatDate(task?.dueDate, 'dd.MM.yy HH:mm')}
        </div>
      </div>

      <div
        className={`font-normal leading-[130%] tracking-[-0.43px] mb-[6.87px] line-clamp-2 ${hideActions ? 'text-[12px]' : 'text-[10.3px]'}`}
      >
        {task?.title || 'Без названия'}
      </div>

      <div className="flex items-end">
        <div
          className={`relative ${hideActions ? 'w-[53px] h-[60px]' : 'w-[45.51px] h-[51.46px]'} overflow-hidden shrink-0`}
        >
          {previewImage ? (
            <img
              src={previewImage.downloadUrl}
              alt={previewImage.name}
              className="w-full h-full object-contain"
            />
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-[6.87px] text-white text-[8.59px] font-normal leading-none">
          <span className="flex items-center gap-[2px]">
            <VideoCountIcon />
            {stats?.videos}/3
          </span>
          <span className="flex items-center gap-[2px]">
            <ImagesCountIcon />+{stats?.images}
          </span>
        </div>
      </div>

      <div className="h-px bg-white/10 my-[6.87px]" />

      <div
        className={`flex items-center ${hideActions ? 'text-[12px]' : 'text-[10.3px]'} tracking-[-0.43px] font-normal mb-[6.87px]`}
      >
        <span className="line-clamp-2">
          {getStringValue(task?.project?.Title) || 'Без проекта'}
        </span>

        <div className="ml-auto flex items-center gap-[3px]">
          <UserAvatar size="xss" user={assignee} />
          <ChevronRightIcon className="w-[15px] h-[15px]" />
          <UserAvatar size="xss" user={createdBy} />
        </div>
      </div>

      <div className="h-px bg-white/10 my-[6.87px]" />

      <div
        className={`flex flex-col gap-[2px] ${hideActions ? 'text-[12px]' : 'text-[10.3px]'} tracking-[-0.43px] font-normal mb-[6.87px]`}
      >
        <div className="flex items-center gap-[2.5px]">
          <SandClock stroke="white" />
          <span>
            {formatTimeHMS(elapsedMs)} / {formatTimeHMS(plannedMs)}
          </span>
        </div>

        <div className="flex items-center gap-[2.5px]">
          <SandClock stroke="white" />
          <div>Продление: 2,5ч</div>
        </div>
      </div>

      {!hideActions && (
        <div className="flex items-center justify-between">
          <Button
            className="text-white !text-[8.21px] w-[72.5px] tracking-[-0.34px] hover:bg-transparent hover:border-[#ffffff86] hover:text-[#ffffff86] px-[16px] py-[6px] font-semibold leading-[130%] border rounded-[68.39px]"
            variant="ghost"
            onClick={onComplete}
          >
            Завершить
          </Button>

          <button
            onClick={onPause}
            className="flex items-center h-[24.5px] w-[24.5px] justify-center shrink-0"
          >
            <Pause height={24.45} width={24.45} />
          </button>
        </div>
      )}
    </div>
  );
};
