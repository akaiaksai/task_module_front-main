// hooks/useUsers.ts
import { useQuery } from '@tanstack/react-query';
import { fetchUsers, getUser, User } from '../../lib/api/users';

export const useUsers = {
  // Хук для поиска пользователей
  useSearch: (search: string) => {
    return useQuery({
      queryKey: ['users', search],
      queryFn: () => fetchUsers(search),
      staleTime: 5 * 60 * 1000, // 5 минут
    });
  },

  useById: (id: number | null) => {
    return useQuery<User | null>({
      queryKey: ['user', id ?? null],
      queryFn: async () => {
        if (typeof id !== 'number') {
          return null;
        }
        return await getUser(id);
      },
      staleTime: 5 * 60 * 1000,
      enabled: typeof id === 'number',
      // Опционально: если хотите, чтобы кэш не сбрасывался при смене с числа на null
      placeholderData: (previousData) => previousData,
    });
  },
  useByIds: (ids: number[]) =>
    useQuery<User[]>({
      queryKey: ['users-by-ids', ids.slice().sort()],
      queryFn: async () => {
        if (ids.length === 0) {
          return [];
        }

        const users = await Promise.all(ids.map((id) => getUser(id)));

        return users.filter(Boolean) as User[];
      },
      enabled: ids.length > 0,
      staleTime: 5 * 60 * 1000,
    }),
};
export const useUserUtils = {
  getDisplayName: (user: User | undefined | null): string => {
    if (!user) {
      return '';
    }

    const name = user.Name?.String || '';
    const lastName = user.LastName?.String || '';
    return [name, lastName].filter(Boolean).join(' ') || `ID: ${user.ID}`;
  },

  getInitials: (user: User | undefined | null): string => {
    if (!user) {
      return '';
    }

    const name = user.Name?.String || '';
    const lastName = user.LastName?.String || '';

    const firstInitial = name.charAt(0).toUpperCase();
    const lastInitial = lastName.charAt(0).toUpperCase();

    return firstInitial + lastInitial || user.ID.toString();
  },
};
