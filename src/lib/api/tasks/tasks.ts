import { http } from '@/lib/http';
import type {
  CreateTaskData,
  Paginated,
  Task,
  TaskDetails,
  TaskStatus,
  TaskType,
} from '@/shared/types/task';
import { Project } from '../../../hooks/groups/useProjectsWithTasks';
import { getNumberValue, getStringValue } from '../../../utils/dataNormalizers';

// Обновляем тип параметров с новыми фильтрами
export type FetchTasksParams = {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  responsibleId?: number;
  createdBy?: number;
  period?: 'day' | 'week' | 'month';
  sort?: string;
  onlyMyTasks?: boolean;
  onlyAuditor?: boolean;
  onlyAccomplice?: boolean;
  onlyCreator?: boolean;
  currentUserId?: number;
  groupId?: number;
  groupIds?: number[];
  assigneeIds?: number[];

  dateFrom?: string; // Новый фильтр DATE_FROM
  dateTo?: string; // Новый фильтр DATE_TO
};

const getTitleValue = (title: ANY): string => {
  const value = getStringValue(title);
  return value || 'Без названия';
};

type BackendTask = {
  ID: number;
  Title: ANY;
  Description?: ANY;
  DescriptionInBbcode?: 'Y' | 'N';
  Priority?: number;
  Status: number;
  ResponsibleID: ANY; // Может быть {Int64: number} или {Int64: number, Valid: boolean}
  ParentID: ANY; // Может быть {Int64: number} или {Int64: number, Valid: boolean}
  CreatedBy?: number;
  CreatedDate?: string;
  ChangedDate?: string;
  StatusChangedDate?: string;
  ActivityDate?: string;
  Deadline?: string | null;
  TimeEstimate?: number | null;
  GroupID?: ANY; // Может быть {Int64: number} или {Int64: number, Valid: boolean}
  StageID?: ANY;
  UfCrmTask: ANY;
  Accomplices?: number[] | null;
  Auditors?: number[] | null;
  TagsCSV: string;
  project: Project;
  Replicate: 'Y' | 'N';
  TaskControl: 'Y' | 'N';
  fileStats?: {
    images: number;
    videos: number;
    documents: number;
    others: number;
  };
};

type BackendListResponse = { result: BackendTask[] };

// Функция для определения типа задачи
function determineTaskType(
  task: Omit<Task, 'type'>,
  currentUserId?: number
): TaskType {
  const now = new Date();

  // 1. Срочные - Только мои задачи + существующий фильтр
  if (currentUserId && task.assigneeId === currentUserId) {
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);

      // Проверяем, что дедлайн сегодня или просрочен (учитывая время)
      const isOverdue = dueDate < now;
      const isToday = dueDate.toDateString() === now.toDateString();

      if (isToday || isOverdue) {
        // Для просроченных задач сразу возвращаем "urgent"
        if (isOverdue) {
          return 'urgent';
        }

        // Для задач на сегодня проверяем процент времени для выполнения
        if (isToday && task.timeEstimate && task.createdAt) {
          const createdAt = new Date(task.createdAt);
          const timePassed = now.getTime() - createdAt.getTime();
          const timeEstimateMs = task.timeEstimate * 1000;
          const timeRemaining = timeEstimateMs - timePassed;

          // Если осталось меньше 20% времени
          if (timeRemaining > 0 && timeRemaining < 0.2 * timeEstimateMs) {
            return 'urgent';
          }
        }
      }
    }
  }

  // 2. Важные - Только мои задачи + существующий фильтр
  if (currentUserId && task.assigneeId === currentUserId) {
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);

      // Важные - задачи на сегодня (только по дате, без учета времени)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dueDateOnly = new Date(dueDate);
      dueDateOnly.setHours(0, 0, 0, 0);

      if (dueDateOnly.getTime() === today.getTime()) {
        return 'important';
      }
    }
  }

  // 3. Регулярные - Только мои задачи + существующий фильтр
  if (currentUserId && task.assigneeId === currentUserId) {
    if (task.replicate === 'Y') {
      return 'regular';
    }
  }

  // 4. Помогаю - Только где соисполнитель
  if (
    currentUserId &&
    task.accomplices &&
    task.accomplices.includes(currentUserId)
  ) {
    return 'helping';
  }

  // 5. Контролирую - backendStatus === 4 ИЛИ наблюдатель, постановщик или соисполнитель
  if (currentUserId) {
    const isAuditor = task.auditors && task.auditors.includes(currentUserId);
    const isCreator = task.createdBy === currentUserId;
    const isAccomplice =
      task.accomplices && task.accomplices.includes(currentUserId);

    if (task.backendStatus === 4 && (isAuditor || isCreator || isAccomplice)) {
      return 'controlling';
    }
  }

  // 6. На потом - Только свои отложенные, без крайнего срока
  if (currentUserId && !task.dueDate && currentUserId === task.assigneeId) {
    return 'later';
  }

  // 7. Обычные задачи
  return 'normal';
}

// Обновим функцию fetchTasks
export async function fetchTasks(params: FetchTasksParams) {
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 10;

  const q: ANY = {
    RESPONSIBLE_ID: params.responsibleId || undefined,
    CREATED_BY: params.createdBy || undefined,
    PERIOD: params.period || undefined,
    GROUP_ID: params.groupId || undefined,
    DEADLINE_FROM: params.dateFrom || undefined,
    DEADLINE_TO: params.dateTo || undefined,
    RESPONSIBLE_IDS: params.assigneeIds,
  };

  Object.keys(q).forEach((key) => {
    if (q[key] === undefined) {
      delete q[key];
    }
  });

  const { data } = await http.get<BackendListResponse>('/tasks/list', {
    params: q,
  });
  let items = (data?.result ?? []).map<Task>((t) => {
    const baseTask: Omit<Task, 'type'> = {
      id: String(t.ID),
      title: getTitleValue(t.Title),
      status: mapStatus(t.Status),
      priority: getNumberValue(t.Priority ?? 0),
      assigneeId: getNumberValue(t.ResponsibleID),
      assigneeName: null,
      createdBy: getNumberValue(t.CreatedBy),
      dueDate: t.Deadline ?? null,
      updatedAt:
        t.ChangedDate ??
        t.ActivityDate ??
        t.CreatedDate ??
        new Date().toISOString(),
      createdAt: t.CreatedDate || null,
      backendStatus: t.Status,
      fileStats: t.fileStats ?? {
        images: 0,
        videos: 0,
        documents: 0,
        others: 0,
      },
      description: getStringValue(t.Description),
      groupId: getNumberValue(t.GroupID)!,
      accomplices: t.Accomplices ?? null,
      auditors: t.Auditors ?? null,
      parentId: getNumberValue(t.ParentID),
      timeEstimate: t.TimeEstimate ?? null,
      UfCrmTask: getStringValue(t.UfCrmTask),
      tagsCSV: t.TagsCSV,
      project: t.project,

      checklist: [],
      elapsed: [],
      comments: [],
      replicate: t.Replicate,
      controlling: t.TaskControl,
    };

    // Определяем тип задачи
    return {
      ...baseTask,
      type: determineTaskType(baseTask, params.currentUserId),
    };
  });

  // Остальная логика фильтрации и пагинации остается без изменений
  if (params.currentUserId) {
    const uid = params.currentUserId;

    const wantMy = !!params.onlyMyTasks;
    const wantAuditor = !!params.onlyAuditor;
    const wantAccomplice = !!params.onlyAccomplice;
    const wantCreator = !!params.onlyCreator;

    if (params.assigneeIds && params.assigneeIds.length > 0) {
      items = items.filter((item) =>
        params.assigneeIds!.includes(item.assigneeId!)
      );
    }

    const anyRoleSelected =
      wantMy || wantAuditor || wantAccomplice || wantCreator;

    if (anyRoleSelected) {
      items = items.filter((item) => {
        const isMy = item.assigneeId === uid;
        const isAuditor = item.auditors?.includes(uid) ?? false;
        const isAccomplice = item.accomplices?.includes(uid) ?? false;
        const isCreator = item.createdBy === uid; // ⚠️ ВАЖНО

        return (
          (wantMy && isMy) ||
          (wantAuditor && isAuditor) ||
          (wantAccomplice && isAccomplice) ||
          (wantCreator && isCreator)
        );
      });
    }

    // groupIds — ОСТАВЛЯЕМ КАК AND (это нормально)
    if (params.groupIds && params.groupIds.length > 0) {
      items = items.filter(
        (item) =>
          item.groupId != null && params.groupIds?.includes(item.groupId)
      );
    }
  }

  if (params.status === '-5') {
    items = items.filter((item) => item.status !== 'done');
  }

  if (params.status && params.status !== '-5' && params.status !== ' ') {
    items = items.filter((item) => {
      const statusNum = parseInt(params.status!);
      const backendStatus = getBackendStatus(item.status);
      return backendStatus === statusNum;
    });
  }

  if (params.search) {
    const s = params.search.toLowerCase();
    items = items.filter((i) => i.title.toLowerCase().includes(s));
  }

  if (params.sort) {
    const desc = params.sort.startsWith('-');
    const field = desc ? params.sort.slice(1) : params.sort;
    items = items.slice().sort((a: ANY, b: ANY) => {
      const av = a[field],
        bv = b[field];
      if (av == null && bv == null) {
        return 0;
      }
      if (av == null) {
        return 1;
      }
      if (bv == null) {
        return -1;
      }
      if (av < bv) {
        return desc ? 1 : -1;
      }
      if (av > bv) {
        return desc ? -1 : 1;
      }
      return 0;
    });
  }

  const total = items.length;
  const start = (page - 1) * perPage;
  const paged = items.slice(start, start + perPage);

  const result: Paginated<Task> = { items: paged, page, perPage, total };
  return result;
}

function pickDate(v: ANY): string | null {
  if (!v) {
    return null;
  }
  if (typeof v === 'string') {
    return v;
  }
  if (
    typeof v === 'object' &&
    typeof v.Time === 'string' &&
    (v.Valid === undefined || v.Valid === true)
  ) {
    return v.Time;
  }
  return null;
}

function getBackendStatus(status: string): number {
  switch (status) {
    case 'open':
      return 3;
    case 'in_progress':
      return 2;
    case 'done':
      return 5;
    case 'blocked':
      return 4;
    default:
      return 3;
  }
}

export function mapStatus(code: number): TaskStatus {
  switch (code) {
    case 2:
      return 'open';
    case 3:
      return 'in_progress';
    case 4:
      return 'waiting_review';
    case 5:
      return 'done';
    case 6:
      return 'blocked';
    default:
      return 'open'; // по умолчанию
  }
}

function extractBackendTaskId(id: string | number): number | null {
  if (typeof id === 'number' && Number.isFinite(id)) {
    return id;
  }

  if (typeof id !== 'string') {
    return null;
  }

  if (id.startsWith('intermediate-') || id.startsWith('meeting-')) {
    const num = Number(id.replace(/^(intermediate|meeting)-/, ''));
    return Number.isFinite(num) ? num : null;
  }

  const num = Number(id);
  return Number.isFinite(num) ? num : null;
}

export async function getTask(id: string) {
  const backendTaskId = extractBackendTaskId(id);

  if (!backendTaskId) {
    throw new Error(`getTask called with UI task id: ${id}`);
  }

  const coreRes = await http.get(`/tasks/${encodeURIComponent(backendTaskId)}`);

  const [checklistRes, commentsRes, elapsedRes] = await Promise.all([
    http.get(`/tasks/${encodeURIComponent(backendTaskId)}/checklist`),
    http.get(`/tasks/${encodeURIComponent(backendTaskId)}/comments`),
    http.get(`/tasks/${encodeURIComponent(backendTaskId)}/elapsed`),
  ]);

  const t = coreRes.data;

  const files =
    t.files?.map((f: ANY) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      mimeType: f.mimeType,
      downloadUrl: f.downloadUrl,
      url: f.url,
    })) ?? [];
  const baseDetails: Omit<TaskDetails, 'type'> = {
    id: String(t.ID),
    title: getTitleValue(t.Title),
    status: mapStatus(t.Status),
    priority: getNumberValue(t.Priority),

    fileStats: t.fileStats ?? {
      images: 0,
      videos: 0,
      documents: 0,
      others: 0,
    },

    assigneeId: getNumberValue(t.ResponsibleID),
    assigneeName: null,

    dueDate: pickDate(t.Deadline),
    updatedAt:
      pickDate(t.ChangedDate) ??
      pickDate(t.ActivityDate) ??
      pickDate(t.CreatedDate) ??
      new Date().toISOString(),

    createdAt: pickDate(t.CreatedDate),

    tagsCSV: t.TagsCSV,
    description: getStringValue(t.Description),
    descriptionInBbcode: (t.DescriptionInBbcode ?? 'N') === 'Y',
    backendStatus: t.Status,
    createdBy: getNumberValue(t.CreatedBy),
    changedDate: pickDate(t.ChangedDate),
    statusChangedDate: pickDate(t.StatusChangedDate),

    timeEstimate: t.TimeEstimate ?? null,
    groupId: getNumberValue(t.GroupID),
    stageId: getNumberValue(t.StageID),

    accomplices: t.Accomplices ?? null,
    auditors: t.Auditors ?? null,
    parentId: getNumberValue(t.ParentID),

    project: t.project,
    company: t.company,
    UfCrmTask: t.UfCrmTask,
    lastMessage: t.lastMessage,
    resume: t.resume,
  };

  const details = {
    ...baseDetails,
    type: determineTaskType(baseDetails, undefined),
    files,
  } as TaskDetails;

  return {
    core: details,
    files,
    checklist: checklistRes.data.result ?? [],
    comments: commentsRes.data.result ?? [],
    elapsed: elapsedRes.data.result ?? [],
  };
}

export async function createTask(payload: CreateTaskData) {
  const { data } = await http.post('/tasks/add', payload);
  return data;
}

export async function updateTask(
  id: string,
  payload: Partial<{
    TITLE?: string;
    STATUS?: number;
    RESPONSIBLE_ID?: number;
    DEADLINE?: string | null;
    PARENT_ID?: number | null;
    TIME_ESTIMATE?: number;
    UF_CRM_TASK?: string;
  }>
) {
  const { data } = await http.post(`/tasks/update/${id}`, payload);
  return data;
}
export function getTaskTypeColorClass(type: TaskType): string {
  switch (type) {
    case 'urgent':
      return 'bg-[#EF4642] text-white';
    case 'important':
      return 'bg-[#E15A11] text-white';
    case 'regular':
      return 'bg-[#E5B702] text-white';
    case 'helping':
    case 'controlling':
    case 'later':
    case 'normal':
    default:
      return 'bg-white text-black';
  }
}
export async function deleteTask(id: string) {
  const { data } = await http.post(`/tasks/delete/${id}`);
  return data;
}

export async function completeTask(id: string) {
  const encodedId = encodeURIComponent(id);

  try {
    // Prefer explicit status update first: it is more stable on current backend
    // and avoids noisy 500s returned by /complete for some task states.
    const { data } = await http.post(`/tasks/update/${encodedId}`, {
      STATUS: 5,
    });
    return data;
  } catch {
    const { data } = await http.post(`/tasks/${encodedId}/complete`);
    return data;
  }
}

export async function fetchUser(id: number) {
  const { data } = await http.get(`/users/${id}`);
  return data;
}

export async function addComment(taskId: string | number, text: string) {
  const { data } = await http.post(`/tasks/${taskId}/comments`, {
    POST_MESSAGE: text,
  });
  return data;
}

export async function toggleChecklistItem(
  taskId: number | string,
  itemId: number,
  isComplete: boolean
) {
  const { data } = await http.post(
    `/tasks/${taskId}/checklist/${itemId}/toggle`,
    { isComplete }
  );
  return data;
}

export async function uploadTaskFile(taskId: number | string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await http.post(`/tasks/${taskId}/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
}
