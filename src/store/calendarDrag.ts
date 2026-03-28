import { create } from 'zustand';

type CalendarDragPayload =
  | {
      source: 'user';
      taskId: number;
      durationHours: number;
      fromUserId: number;

      TIME_ESTIMATE?: number;
      TITLE?: string;
      GROUP_ID?: number | null;
      groupColor?: string;
    }
  | {
      source: 'project';
      taskId: number;
      durationHours: number;

      TIME_ESTIMATE?: number;
      TITLE?: string;
      GROUP_ID?: number | null;
      groupColor?: string;
    };

type CalendarDragState = {
  payload: CalendarDragPayload | null;
  setPayload: (p: CalendarDragPayload) => void;
  clear: () => void;
};

export const useCalendarDragStore = create<CalendarDragState>((set) => ({
  payload: null,
  setPayload: (payload) => set({ payload }),
  clear: () => set({ payload: null }),
}));
