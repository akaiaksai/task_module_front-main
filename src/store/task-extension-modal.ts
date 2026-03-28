import { create } from 'zustand';

interface TaskExtensionModal {
  isOpen: boolean;
  taskId: string | null;
  originalTask: ANY | null;
  shownTasks: Set<string>;
  openModal: (taskId: string, originalTask: ANY) => void;
  closeModal: () => void;
  markAsShown: (taskId: string) => void;
  isTaskShown: (taskId: string) => boolean;
  resetShownTasks: () => void;
}

export const useTaskExtensionModal = create<TaskExtensionModal>((set, get) => ({
  isOpen: false,
  taskId: null,
  originalTask: null,
  shownTasks: new Set(),

  openModal: (taskId, originalTask) =>
    set({
      isOpen: true,
      taskId,
      originalTask,
    }),

  closeModal: () =>
    set({
      isOpen: false,
      taskId: null,
      originalTask: null,
    }),

  markAsShown: (taskId) => {
    const { shownTasks } = get();
    const newShownTasks = new Set(shownTasks);
    newShownTasks.add(taskId);
    set({ shownTasks: newShownTasks });
  },

  isTaskShown: (taskId) => {
    const { shownTasks } = get();
    return shownTasks.has(taskId);
  },

  resetShownTasks: () => set({ shownTasks: new Set() }),
}));
