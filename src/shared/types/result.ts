export interface TaskResult {
  id: number;
  taskId: number;
  commentId: number;
  createdBy: number;
  createdAt: string;
  text: string;
  files: ANY[] | null;
}

export interface TaskResultsResponse {
  result: TaskResult[];
}

export interface AddResultResponse {
  result: TaskResult;
}

export interface DeleteResultResponse {
  status: string;
}
