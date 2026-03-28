import {
  CommentsResponse,
  CreateCommentData,
  CreateCommentResponse,
  UpdateCommentData,
} from '../../../shared/types/comment';
import { http } from '../../http';

export const fetchComments = async (
  taskId: string
): Promise<CommentsResponse> => {
  const { data } = await http.get<CommentsResponse>(
    `/tasks/${taskId}/comments`
  );
  return data;
};

export const createComment = async (
  taskId: string,
  commentData: CreateCommentData
): Promise<CreateCommentResponse> => {
  const { data } = await http.post<CreateCommentResponse>(
    `/tasks/${taskId}/comments`,
    commentData
  );
  return data;
};

export const updateComment = async (
  taskId: string,
  commentId: number,
  commentData: UpdateCommentData
): Promise<void> => {
  await http.put(`/tasks/${taskId}/comments/${commentId}`, commentData);
};

export const deleteComment = async (
  taskId: string,
  commentId: number
): Promise<void> => {
  await http.delete(`/tasks/${taskId}/comments/${commentId}`);
};
