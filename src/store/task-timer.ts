import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useTaskSelectionModalStore } from './task-selection-modal';
import { useTimemanStore } from './timeman';
import { useTaskExtensionModal } from './task-extension-modal';

interface TaskTimer {
  taskId: string;
  title: string;
  plannedMinutes: number;
  startTime: number | null;
  totalElapsed: number;
  isRunning: boolean;
}

interface TaskTimerState {
  tasks: TaskTimer[];
  activeTaskId: string | null;
  lastTaskId: string | null;
  updateTaskMeta: (
    taskId: string,
    meta: { title?: string; plannedMinutes?: number }
  ) => void;

  startTask: (
    taskId: string,
    meta?: { title: string; plannedMinutes: number }
  ) => void;
  requestPause: (taskId?: string) => void;
  pauseTask: (taskId?: string, breakMinutes?: number) => Promise<void>;
  stopTask: (taskId: string, isOverdue?: boolean) => number;
  getCurrentElapsed: (taskId: string) => number;
  getTask: (taskId: string) => TaskTimer | undefined;
  getAllTasks: () => TaskTimer[];
  resetTaskTimer: (taskId: string) => void;
  resetAllTasks: () => void;
}

export const useTaskTimerStore = create<TaskTimerState>()(
  persist(
    (set, get) => ({
      tasks: [],
      activeTaskId: null,
      lastTaskId: null,

      startTask: (
        taskId: string,
        meta?: { title: string; plannedMinutes: number }
      ) => {
        const state = get();

        const updatedTasks = state.tasks.map((task) => {
          if (task.isRunning && task.startTime) {
            const sessionElapsed = Date.now() - task.startTime;
            return {
              ...task,
              isRunning: false,
              startTime: null,
              totalElapsed: task.totalElapsed + sessionElapsed,
            };
          }
          return task;
        });

        const taskIndex = updatedTasks.findIndex((t) => t.taskId === taskId);

        if (taskIndex >= 0) {
          const task = updatedTasks[taskIndex];
          updatedTasks[taskIndex] = {
            ...task,
            isRunning: true,
            startTime: Date.now(),
          };
        } else {
          updatedTasks.push({
            taskId,
            title: meta?.title ?? '',
            plannedMinutes: meta?.plannedMinutes ?? 0,
            startTime: Date.now(),
            totalElapsed: 0,
            isRunning: true,
          });
        }

        set({
          tasks: updatedTasks,
          activeTaskId: taskId,
          lastTaskId: taskId,
        });

        const timemanStore = useTimemanStore.getState();
        if (timemanStore.status === 'closed') {
          timemanStore.openWorkday().catch((error) => {
            console.error(
              'Не удалось автоматически открыть рабочий день:',
              error
            );
          });
        }
      },

      requestPause: (taskId?: string) => {
        const state = get();
        const targetTaskId = taskId || state.activeTaskId;

        if (!targetTaskId) {
          return;
        }

        set({ lastTaskId: targetTaskId });

        useTaskSelectionModalStore
          .getState()
          .openModal({ mode: 'pause', taskId: targetTaskId });
      },

      pauseTask: async (taskId?: string, breakMinutes?: number) => {
        const state = get();
        const targetTaskId = taskId || state.activeTaskId;

        if (!targetTaskId) {
          return;
        }

        const updatedTasks = state.tasks.map((task) => {
          if (
            task.taskId === targetTaskId &&
            task.isRunning &&
            task.startTime
          ) {
            const sessionElapsed = Date.now() - task.startTime;
            return {
              ...task,
              isRunning: false,
              startTime: null,
              totalElapsed: task.totalElapsed + sessionElapsed,
            };
          }
          return task;
        });

        set({
          tasks: updatedTasks,
          activeTaskId:
            state.activeTaskId === targetTaskId ? null : state.activeTaskId,
          lastTaskId: targetTaskId,
        });

        const timemanStore = useTimemanStore.getState();
        await timemanStore.pauseWorkday(breakMinutes!);
      },

      updateTaskMeta: (taskId, meta) => {
        const state = get();

        set({
          tasks: state.tasks.map((task) =>
            task.taskId === taskId
              ? {
                  ...task,
                  title: meta.title ?? task.title,
                  plannedMinutes: meta.plannedMinutes ?? task.plannedMinutes,
                }
              : task
          ),
        });
      },

      stopTask: (taskId: string, isOverdue = false) => {
        const state = get();
        const task = state.tasks.find((t) => t.taskId === taskId);

        if (!task) {
          return 0;
        }

        let finalElapsed = task.totalElapsed;

        if (task.isRunning && task.startTime) {
          finalElapsed += Date.now() - task.startTime;
        }

        const updatedTasks = state.tasks.filter((t) => t.taskId !== taskId);

        set({
          tasks: updatedTasks,
          activeTaskId:
            state.activeTaskId === taskId ? null : state.activeTaskId,
          lastTaskId: taskId,
        });

        // НЕ показываем модалку выбора, если задача остановлена из-за просрочки
        if (!isOverdue) {
          const extensionModal = useTaskExtensionModal.getState();
          if (!extensionModal.isOpen) {
            const modalStore = useTaskSelectionModalStore.getState();
            modalStore.openModal();
          }
        }

        return Math.floor(finalElapsed / 1000);
      },

      getCurrentElapsed: (taskId: string) => {
        const state = get();
        const task = state.tasks.find((t) => t.taskId === taskId);

        if (!task) {
          return 0;
        }

        let currentElapsed = task.totalElapsed;

        if (task.isRunning && task.startTime) {
          currentElapsed += Date.now() - task.startTime;
        }

        return currentElapsed;
      },

      getTask: (taskId: string) => {
        const state = get();
        return state.tasks.find((t) => t.taskId === taskId);
      },

      getAllTasks: () => {
        const state = get();
        return state.tasks;
      },

      resetTaskTimer: (taskId: string) => {
        const state = get();
        const updatedTasks = state.tasks.filter((t) => t.taskId !== taskId);

        set({
          tasks: updatedTasks,
          activeTaskId:
            state.activeTaskId === taskId ? null : state.activeTaskId,
          lastTaskId:
            state.activeTaskId === taskId || state.lastTaskId === taskId
              ? null
              : state.lastTaskId,
        });
      },

      resetAllTasks: () => {
        set({
          tasks: [],
          activeTaskId: null,
          lastTaskId: null,
        });
      },
    }),
    {
      name: 'task-timer-storage',
    }
  )
);
