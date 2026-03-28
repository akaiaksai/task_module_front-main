import { TaskSelectionModalDesktop } from './TaskSelectionModalDesktop';
import { useMediaQuery } from '@/hooks/ui/useMediaQuery';
import { TaskSelectionModalMobile } from './TaskSelectionModalMobile';

export const TaskSelectionModal = () => {
  const isMobile = useMediaQuery('(max-width: 1024px)');

  return isMobile ? (
    <TaskSelectionModalMobile />
  ) : (
    <TaskSelectionModalDesktop />
  );
};
