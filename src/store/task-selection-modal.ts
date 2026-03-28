// stores/task-selection-modal.ts
import { create } from 'zustand';

export type TaskSelectionMode = 'pause' | 'complete';

interface TaskSelectionModalState {
  isOpen: boolean;
  mode: TaskSelectionMode;
  targetTaskId: string | null;

  openModal: (params?: { mode?: TaskSelectionMode; taskId?: string }) => void;
  closeModal: () => void;
}

export const useTaskSelectionModalStore = create<TaskSelectionModalState>(
  (set) => ({
    isOpen: false,
    mode: 'pause',
    targetTaskId: null,

    openModal: (params) =>
      set({
        isOpen: true,
        mode: params?.mode ?? 'pause',
        targetTaskId: params?.taskId ?? null,
      }),

    closeModal: () =>
      set({
        isOpen: false,
        mode: 'pause',
        targetTaskId: null,
      }),
  })
);
