import { http } from '@/lib/http';
import { useQuery } from '@tanstack/react-query';
import { useTasks } from '../tasks/useTaskActions';
import { useGroupById } from './useGroup';

export interface User {
  ID: number;
  Name: { String: string; Valid: boolean };
  LastName: { String: string; Valid: boolean };
  Email?: { String: string; Valid: boolean };
}

export interface Task {
  id: string;
  title: string;
  status: string;

  // processedTask кладёт string | undefined из getStringValue,
  // optional даёт ещё и undefined, так что всё ок
  description?: string | null;

  // то же самое для dueDate
  dueDate?: string | null;

  priority: string;

  // КРИТИЧНО: createdAt в processedTask имеет тип string | undefined,
  // поэтому тут делаем поле optional, чтобы оно принимало и undefined
  createdAt?: string | null;

  updatedAt: string;

  assigneeId: number | null;

  // в processedTask: groupId?: number | null
  groupId?: number | null;

  accomplices: number[] | null | undefined;
  auditors: number[] | null | undefined;

  createdBy: string | null | undefined | number;

  checklist: ANY;
  elapsed: ANY;

  comments: ANY;

  statusChangedDate?: string | null;

  // хвост всего, что едет из ...task.core и прочих полей
  [key: string]: ANY;
}

export function getDisplayName(user: ANY): string {
  if (!user) {
    return 'Неизвестный пользователь';
  }
  if (typeof user === 'string') {
    return user;
  }
  if (user.Name && user.LastName) {
    const firstName = user.Name.Valid ? user.Name.String : '';
    const lastName = user.LastName.Valid ? user.LastName.String : '';
    return `${firstName} ${lastName}`.trim() || `Пользователь ${user.ID}`;
  }
  if (user.Name && typeof user.Name === 'string') {
    return user.Name;
  }
  return `Пользователь ${user.ID || 'Неизвестный'}`;
}
export function useGroupMembers(projectId: string, filters: ANY = {}) {
  // Используем кэшированные группы вместо отдельного запроса
  const {
    group: project,
    isLoading: projectLoading,
    error: projectError,
  } = useGroupById(projectId);

  const {
    data: tasksData,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useTasks(
    {
      groupId: projectId ? parseInt(projectId) : undefined,
      ...filters,
    },
    {
      keepPreviousData: true,
    }
  );

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const { data } = await http.get<{ result: User[] }>('/users');
      return data.result;
    },
    staleTime: 10 * 60 * 1000,
  });

  const projectTasks = tasksData?.items || [];

  const isLoading = projectLoading || usersQuery.isLoading || tasksLoading;
  const error = projectError || usersQuery.error || tasksError;

  const membersWithTasks =
    usersQuery.data
      ?.map((user) => {
        const userTasks = projectTasks.filter(
          (task) => task.assigneeId === user.ID
        );

        const sortedUserTasks = userTasks.sort((a, b) =>
          a.title.localeCompare(b.title, 'ru', { sensitivity: 'base' })
        );

        return { user, tasks: sortedUserTasks };
      })
      // Сортируем участников по алфавиту (по имени и фамилии)
      .sort((a, b) => {
        const nameA = getDisplayName(a.user).toLowerCase();
        const nameB = getDisplayName(b.user).toLowerCase();
        return nameA.localeCompare(nameB, 'ru', { sensitivity: 'base' });
      })
      .filter((member) => member.tasks.length > 0) || [];
  return {
    project,
    members: membersWithTasks,
    allTasks: projectTasks,
    isLoading,
    error,
    refetchTasks,
  };
}
