// hooks/groups/useUserGroups.ts
import { useMemo } from 'react';
import { useAuthStore } from '@/store/auth';
import { useGroups } from './useGroup';
import { useAllTasks } from '../tasks/useTaskActions';

export function useUserGroups() {
  const { groups, isLoading: groupsLoading } = useGroups();
  const { isAdmin } = useAuthStore();

  const { data: allTasks = [], isLoading: tasksLoading } = useAllTasks({
    isEnabled: !isAdmin,
  });

  const userGroupIds = useMemo(() => {
    if (isAdmin) {
      return [];
    }

    const groupIds = new Set<number>();
    allTasks?.forEach((task) => {
      // Добавляем безопасную проверку
      if (task?.groupId) {
        groupIds.add(task.groupId);
      }
    });
    return Array.from(groupIds);
  }, [allTasks, isAdmin]);

  // Фильтруем группы с проверкой типа
  const userGroups = useMemo(() => {
    if (!Array.isArray(groups)) {
      return [];
    } // Защита от не-массивов

    if (isAdmin) {
      return groups;
    }
    return groups.filter((group) => userGroupIds.includes(group.ID));
  }, [groups, isAdmin, userGroupIds]);

  const isLoading = groupsLoading || (!isAdmin && tasksLoading);

  return {
    groups: userGroups,
    isLoading,
    error: null,
    hasTasks: userGroupIds.length > 0,
  };
}
