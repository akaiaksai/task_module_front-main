import { Project } from '../../hooks/groups/useProjectsWithTasks';

export type TaskStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_review'
  | 'done'
  | 'blocked';
// export type TaskPriority = "low" | "normal" | "high" | "urgent";

export type TaskType =
  | 'urgent' // Срочные
  | 'important' // Важные
  | 'regular' // Регулярные
  | 'helping' // Помогаю
  | 'controlling' // Контролирую
  | 'later' // На потом
  | 'normal'; // Обычные

export type FileStats = {
  images: number;
  videos: number;
  documents: number;
  others: number;
};

export type Task = {
  id: string;
  title: string;
  status: TaskStatus; // "open"
  backendStatus: number;
  priority: number | string | null;
  assigneeId: number | null;
  assigneeName?: string | null;
  dueDate?: string | null; // ISO
  updatedAt: string; // ISO
  description?: string | null;
  createdAt?: string | null; // ISO
  groupId: number;
  stageId?: number | null;
  accomplices?: number[] | null;
  auditors?: number[] | null;
  UfCrmTask?: string;
  checklist: ANY;
  elapsed: ANY;
  parentId: number | null;
  timeEstimate?: number | null;
  createdBy?: number | null;
  tagsCSV: string;
  project: Project;
  type: TaskType;
  comments: ANY;
  replicate: string;
  controlling: string;
  files?: {
    id: number;
    name: string;
    size: number;
    mimeType: string;
    downloadUrl: string;
    url: string;
  }[];
  fileStats?: FileStats;
};

export type TaskDetails = Task & {
  descriptionInBbcode?: boolean;
  createdBy?: number | null;
  changedDate?: string | null;
  statusChangedDate?: string | null;
  timeEstimate?: number | null;
  id: string;
  title: string;
  status: string;
  // optional даёт ещё и undefined, так что всё ок
  description?: string | null;
  // то же самое для dueDate
  dueDate?: string | null;
  priority: string;
  // поэтому тут делаем поле optional, чтобы оно принимало и undefined
  createdAt?: string | null;
  updatedAt: string;
  assigneeId: number | null;
  // в processedTask: groupId?: number | null
  groupId?: number | null;
  accomplices: number[] | null | undefined;
  auditors: number[] | null | undefined;
  checklist: ANY;
  elapsed: ANY;
  comments: ANY;
  company?: {
    ID: number;
    Title: string;
    CompanyType?: string;
    [key: string]: ANY;
  } | null;
  files?: {
    id: number;
    name: string;
    size: number;
    mimeType: string;
    downloadUrl: string;
  }[];
  // хвост всего, что едет из ...task.core и прочих полей
  [key: string]: ANY;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  perPage: number;
  total: number;
};

export interface CreateTaskData {
  TITLE: string;
  DESCRIPTION?: string;
  PARENT_ID?: number;
  RESPONSIBLE_ID: number;
  GROUP_ID?: number;
  DEADLINE?: string | null;
  ACCOMPLICES?: number[];
  AUDITORS?: number[];
  TIME_ESTIMATE?: number;
}

export interface UpdateTaskData {
  TITLE?: string;
  DESCRIPTION?: string;
  STATUS?: number;
  RESPONSIBLE_ID?: number;
  GROUP_ID?: number;
  DEADLINE?: string | null;
  TIME_ESTIMATE?: number;
}

export interface TaskActionResponse {
  message: string;
  success: boolean;
  status: string;
}
