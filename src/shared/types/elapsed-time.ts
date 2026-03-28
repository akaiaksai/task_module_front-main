// types/elapsed-time.ts
export interface ApiElapsedTimeItem {
  ID: number;
  CreatedDate: string;
  DateStart: string;
  DateStop: string;
  UserID: number;
  UserName?: string;
  Seconds: number;
  Minutes: number;
  TaskID: number;
  CommentText: CommentText;
}
export interface CommentText {
  String: string;
  Valid: boolean;
}
export interface ElapsedTimeResponse {
  result: ApiElapsedTimeItem[];
}

export interface CreateElapsedTimeData {
  seconds: number;
  comment?: string;
}

export interface CreateElapsedTimeResponse {
  status: string;
}

export interface UpdateElapsedTimeData {
  seconds?: number;
  comment?: string;
}
