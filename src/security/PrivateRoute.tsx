import { useMediaQuery } from '@/hooks/ui/useMediaQuery';
import { createTask } from '@/lib/api/tasks/tasks';
import { MobileBottomNav } from '@/screens/tasks/_mobile/_mobilenavbar/MobileBottomNav';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import clsx from 'clsx';
import { Plus } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '../components/base/Header';
import TaskFormModal from '../screens/tasks/_desktop/_tasks-modals/TaskFormModal';
import { SideMenu } from '../screens/tasks/_mobile/_menu/SideMenu';

interface AnimatedLayoutProps {
  children: ReactNode;
  backgroundColor: string;
  backgroundImage?: string;
}

const AnimatedLayout = ({ children, backgroundColor }: AnimatedLayoutProps) => {
  const isMenuOpen = useUIStore((state) => state.isMenuOpen);
  const location = useLocation(); // Добавляем хук для получения текущего пути
  const isCalendarOpen = useUIStore((state) => state.isCalendarOpen);
  // Состояние для модалки создания задачи
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1023px)');

  // Функция для открытия модалки
  const handleCreateTask = () => {
    setIsTaskModalOpen(true);
  };

  // Функция для закрытия модалки
  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
  };

  // Функция для отправки формы задачи
  const handleTaskSubmit = async (taskData: ANY) => {
    try {
      console.log(taskData);
      await createTask(taskData);
      toast.success('Задача создана');
      handleCloseTaskModal();
    } catch (error) {
      console.log(error);
      toast.error('Не удалось создать задачу');
    }
  };

  const isHomePage = location.pathname === '/';

  return (
    <div
      className={'min-h-screen relative'}
      style={{
        backgroundColor: location.pathname.startsWith('/tasks')
          ? '#0b0b0b'
          : backgroundColor,
        backgroundImage: location.pathname.startsWith('/tasks')
          ? 'radial-gradient(100% 191.93% at 100% 50%, rgba(15, 17, 32, 0.2) 8.91%, rgba(11, 11, 11, 0.2) 24.77%, rgba(48, 198, 241, 0.2) 43.21%, rgba(59, 76, 188, 0.2) 85.86%, rgba(15, 17, 32, 0.2) 100%)'
          : undefined,
      }}
    >
      <SideMenu />
      <div className="relative overflow-hidden">
        <div
          className={clsx(
            'will-change-transform transition-transform duration-300 ease-out',
            isMenuOpen && 'translate-x-80'
          )}
        >
          {children}
        </div>
      </div>

      {/* Глобальная кнопка создания задачи - ТОЛЬКО НА ГЛАВНОЙ СТРАНИЦЕ */}
      {!isMenuOpen && isHomePage && !isCalendarOpen && (
        <div className="fixed right-6 bottom-16 z-40">
          <button
            onClick={handleCreateTask}
            className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 bg-black text-white"
            aria-label="Создать задачу"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Модалка создания задачи */}
      <TaskFormModal
        open={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        onSubmit={handleTaskSubmit}
        mode="create"
        isLoading={false}
      />

      {!isCalendarOpen && isMobile && <MobileBottomNav />}
    </div>
  );
};

export function PrivateRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  const pageBackgroundColor = location.pathname === '/' ? '#FFFFFF' : '';

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <AnimatedLayout backgroundColor={pageBackgroundColor}>
      <Header />
      <main className="container px-3 pb-[40px]">
        <Outlet />
      </main>
    </AnimatedLayout>
  );
}
