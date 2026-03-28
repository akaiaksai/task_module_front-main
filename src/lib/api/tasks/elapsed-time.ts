// lib/api/tasks/elapsed-time.ts
import {
  ElapsedTimeResponse,
  CreateElapsedTimeData,
  CreateElapsedTimeResponse,
  UpdateElapsedTimeData,
} from '@/shared/types/elapsed-time';
import { http } from '../../http';

export const fetchElapsedTimes = async (
  taskId: string
): Promise<ElapsedTimeResponse> => {
  const response = await http.get(`/tasks/${taskId}/elapsed`);
  return response.data;
};

export const createElapsedTime = async (
  taskId: number,
  data: CreateElapsedTimeData
): Promise<CreateElapsedTimeResponse> => {
  const response = await http.post(`/tasks/${taskId}/add-time`, data);
  return response.data;
};

export const updateElapsedTime = async (
  taskId: string,
  itemId: number,
  data: UpdateElapsedTimeData
): Promise<void> => {
  const response = await http.put(`/tasks/${taskId}/elapsed/${itemId}`, data);
  return response.data;
};

export const deleteElapsedTime = async (
  taskId: string,
  itemId: number
): Promise<void> => {
  const response = await http.delete(`/tasks/${taskId}/elapsed/${itemId}`);
  return response.data;
};

export interface ElapsedTimeRecord {
  ID: number;
  CREATED_DATE: string;
  DATE_START: string;
  DATE_STOP: string;
  USER_ID: number;
  TASK_ID: number;
  MINUTES: number;
  SECONDS: number;
  COMMENT_TEXT: string;
}

export const getElapsedTimeForUser = async (
  userId: number,
  startDate: Date,
  endDate: Date
): Promise<ElapsedTimeResponse> => {
  // Изменен тип возвращаемого значения
  const response = await http.get(`/elapsed-time`, {
    params: {
      userId,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
  });

  return response.data;
};
