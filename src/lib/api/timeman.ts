import { CloseWorkdayParams } from '../../shared/types/timeman';
import { http } from '../http';

// Открытие рабочего дня
export const openWorkday = async (): Promise<{ status: string }> => {
  const response = await http.post('/timeman/open');
  return response.data;
};

// Пауза рабочего дня
export const pauseWorkday = async (
  breakMinutes: number
): Promise<{ status: string }> => {
  const response = await http.post('/timeman/pause', {
    break_minutes: breakMinutes,
  });
  return response.data;
};

// Закрытие рабочего дня
export const closeWorkday = async (
  params: CloseWorkdayParams
): Promise<{ status: string }> => {
  const response = await http.post('/timeman/close', params);
  return response.data;
};

export const getActiveBreak = async (): Promise<{
  started_at: string | null;
  ends_at: string | null;
}> => {
  const res = await http.get('/timeman/break');
  return res.data;
};
