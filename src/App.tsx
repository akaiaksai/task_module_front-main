import { Suspense, useEffect } from 'react';
import { useRoutes } from 'react-router-dom';
import { AutoCloseWarning } from './components/alerts/AutoCloseWarning';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { useBreakFinishedReminder } from './hooks/tasks/useBreakFinishedReminder';
import { useTaskTimeMonitor } from './hooks/tasks/views/useTaskTimeMonitor';
import { useAutoCloseWorkday } from './hooks/timeman/useWorkDay';
import routes from './routes';
import { TaskExtensionModal } from './screens/tasks/_desktop/_tasks-modals/TaskExtensionModal';
import { TaskSelectionModal } from './screens/tasks/_desktop/_tasks-modals/TaskSelectionModal';
import { useBreakTimerStore } from './store/break-timer';
// import { useBreakAutoCancelOnTaskStart } from './store/useBreakAutoCancelOnTaskStart';
import { useBreakWatcher } from './hooks/tasks/modal/useBreakWatcher';

export function BreakTimerBootstrap() {
  const breakEndsAt = useBreakTimerStore((s) => s.breakEndsAt);
  const clearBreak = useBreakTimerStore((s) => s.clearBreak);

  useEffect(() => {
    if (!breakEndsAt) {
      return;
    }

    const remaining = breakEndsAt - Date.now();

    if (remaining <= 0) {
      clearBreak();
      window.dispatchEvent(new CustomEvent('break-finished'));
      return;
    }

    const timer = window.setTimeout(() => {
      clearBreak();
      window.dispatchEvent(new CustomEvent('break-finished'));
    }, remaining);

    return () => clearTimeout(timer);
  }, [breakEndsAt, clearBreak]);

  return null;
}

export default function App() {
  const element = useRoutes(routes);
  useAutoCloseWorkday();
  useTaskTimeMonitor();
  useBreakFinishedReminder();
  // useBreakAutoCancelOnTaskStart();
  useBreakWatcher();

  return (
    <AppErrorBoundary>
      <Suspense fallback={<div className="p-6">Загрузка…</div>}>
        <BreakTimerBootstrap />
        <AutoCloseWarning />
        <TaskExtensionModal />
        <TaskSelectionModal />
        {element}
      </Suspense>
    </AppErrorBoundary>
  );
}
