// store/ui.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Task } from '../shared/types/task';

export interface BottomPill {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

interface UIState {
  isMenuOpen: boolean;
  pageBackgroundColor: string;
  headerBottomContent: React.ReactNode | null;
  bottomPills: BottomPill[];
  meetingTasks: Task[];
  dayTasks: Task[];
  isCalendarOpen: boolean; // Добавляем состояние календаря

  setBottomPills: (pills: BottomPill[]) => void;
  clearBottomPills: () => void;
  toggleMenu: () => void;
  openMenu: () => void;
  closeMenu: () => void;
  setPageBackgroundColor: (color: string) => void;
  setHeaderBottomContent: (content: React.ReactNode | null) => void;
  setMeetingTasks: (tasks: Task[]) => void;
  setDayTasks: (tasks: Task[]) => void;
  setIsCalendarOpen: (isOpen: boolean) => void; // Добавляем функцию
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      isMenuOpen: false,
      pageBackgroundColor: '#F9FAFB',
      headerBottomContent: null,
      bottomPills: [],
      meetingTasks: [],
      dayTasks: [],
      isCalendarOpen: false, // По умолчанию закрыт

      toggleMenu: () =>
        set((state) => ({
          isMenuOpen: !state.isMenuOpen,
        })),

      setBottomPills: (pills) => set({ bottomPills: pills }),
      clearBottomPills: () => set({ bottomPills: [] }),

      openMenu: () => set({ isMenuOpen: true }),

      closeMenu: () => set({ isMenuOpen: false }),

      setPageBackgroundColor: (color: string) =>
        set({ pageBackgroundColor: color }),

      setHeaderBottomContent: (content: React.ReactNode | null) =>
        set({ headerBottomContent: content }),

      setMeetingTasks: (tasks) => set({ meetingTasks: tasks }),
      setDayTasks: (tasks) => set({ dayTasks: tasks }),

      setIsCalendarOpen: (isOpen: boolean) => set({ isCalendarOpen: isOpen }),
    }),
    { name: 'UI Store' }
  )
);
