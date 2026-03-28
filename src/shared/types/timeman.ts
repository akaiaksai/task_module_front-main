export interface TimemanState {
  status: 'opened' | 'paused' | 'closed' | null;
  isLoading: boolean;
  error: string | null;
  lastAction: string | null;
}

export interface CloseWorkdayParams {
  report: string;
}
