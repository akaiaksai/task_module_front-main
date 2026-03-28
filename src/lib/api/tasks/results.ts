import {
  TaskResultsResponse,
  AddResultResponse,
  DeleteResultResponse,
} from '../../../shared/types/result';
import { http } from '../../http';

export const fetchTaskResults = async (
  taskId: string | number
): Promise<TaskResultsResponse> => {
  const { data } = await http.get<TaskResultsResponse>(
    `/tasks/${taskId}/results`
  );
  return data;
};

export const addCommentAsResult = async (
  taskId: string | number,
  commentId: number
): Promise<AddResultResponse> => {
  const { data } = await http.post<AddResultResponse>(
    `/tasks/${taskId}/comments/${commentId}/add-result`
  );
  return data;
};

export const removeCommentFromResults = async (
  taskId: string | number,
  commentId: number
): Promise<DeleteResultResponse> => {
  const { data } = await http.delete<DeleteResultResponse>(
    `/tasks/${taskId}/comments/${commentId}/delete-result`
  );
  return data;
};
