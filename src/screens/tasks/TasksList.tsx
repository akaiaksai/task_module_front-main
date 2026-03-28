import { useMediaQuery } from '../../hooks/ui/useMediaQuery';
import TasksPageDesktop from './_desktop/TasksPageDesktop';
import TasksPageMobile from './_mobile/TasksPageMobile';

export default function TasksPage() {
  const isMobile = useMediaQuery('(max-width: 1023px)');

  if (isMobile) {
    return <TasksPageMobile />;
  }

  return <TasksPageDesktop />;
}
