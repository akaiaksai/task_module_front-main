import { useQuery } from '@tanstack/react-query';
import { fetchUsers, User } from '../../lib/api/users';
import { useUserUtils } from './useUserActions';

export const useUserLocal = {
  useAllUsers: () => {
    return useQuery({
      queryKey: ['all-users'],
      queryFn: () => fetchUsers(''), // Пустая строка = все пользователи
      staleTime: 5 * 60 * 1000, // 5 минут
    });
  },

  // Хук для поиска пользователя по ID в локальном списке
  useUserById: (id: number | null): User | null => {
    const { data: allUsersData } = useUserLocal.useAllUsers();
    const allUsers = allUsersData?.result || [];

    if (!id) {
      return null;
    }
    return allUsers.find((user) => user.ID === id) || null;
  },

  // Хук для получения отображаемого имени по ID
  useDisplayNameById: (id: number | null): string => {
    const user = useUserLocal.useUserById(id);
    return useUserUtils.getDisplayName(user);
  },

  // Хук для получения Map всех пользователей (для оптимизации)
  useUsersMap: () => {
    const { data: allUsersData, isLoading } = useUserLocal.useAllUsers();
    const allUsers = allUsersData?.result || [];

    const usersMap = new Map(allUsers.map((user) => [user.ID, user]));

    const getUserById = (id: number | null): User | null => {
      return id ? usersMap.get(id) || null : null;
    };

    const getDisplayNameById = (id: number | null): string => {
      const user = getUserById(id);
      return useUserUtils.getDisplayName(user);
    };

    return {
      usersMap,
      isLoading,
      getUserById,
      getDisplayNameById,
    };
  },
};
