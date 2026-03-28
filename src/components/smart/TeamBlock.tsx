import { MultiSelectSearch } from '@/components/dumb/MultiSelect';
import { useTaskActions } from '@/hooks/tasks/useTaskActions';
import { useUserUtils } from '@/hooks/users/useUserActions';
import { useUserLocal } from '@/hooks/users/useUserLocal';
import { User } from '@/lib/api/users';
import { Member } from '@/shared/interfaces/Member';
import { WindowCard } from '@components/dumb/WindowCard';
import { SetStateAction, useMemo, useState } from 'react';
import { toast } from 'sonner';

export function TeamBlock({
  task,
  onClose,
  teamMembers,
}: {
  task: ANY;
  onClose: () => void;
  teamMembers: Member[];
}) {
  const { data: allUsersData } = useUserLocal.useAllUsers();
  const { updateTask } = useTaskActions();

  const allUsers = useMemo(() => {
    const allUsersFromHook =
      allUsersData?.result?.map((user: User) => ({
        id: user.ID,
        name: useUserUtils.getDisplayName(user),
      })) || [];

    const teamMemberIds = new Set(teamMembers.map((member) => member.id));

    const otherUsers = allUsersFromHook.filter(
      (user) => !teamMemberIds.has(user.id)
    );

    return [...teamMembers, ...otherUsers];
  }, [allUsersData, teamMembers]);

  // Локальное состояние для оптимистичных обновлений
  const [main, setMain] = useState<Member[]>(
    task?.assigneeId ? teamMembers.filter((m) => m.id === task.assigneeId) : []
  );

  const [assistants, setAssistants] = useState<Member[]>(
    teamMembers.filter((m) => task.accomplices?.includes(m.id))
  );

  const [leader, setLeader] = useState<Member[]>(
    task?.createdBy
      ? teamMembers.filter((m) => m.id === task.createdBy.Int64)
      : []
  );

  const [watchers, setWatchers] = useState<Member[]>(
    teamMembers.filter((m) => task.auditors?.includes(m.id))
  );

  // Функции для обновления через API с оптимистичными обновлениями
  const handleUpdateMain = async (newMain: Member[]) => {
    const previousMain = main;
    setMain(newMain);

    try {
      await updateTask({
        id: task.id,
        payload: {
          RESPONSIBLE_ID: newMain[0]?.id || null,
        },
      });
    } catch (error) {
      setMain(previousMain);
      console.error('Ошибка при обновлении главного:', error);
      toast.error('Не удалось обновить главного');
    }
  };

  const handleUpdateAssistants = async (newAssistants: Member[]) => {
    const previousAssistants = assistants;
    setAssistants(newAssistants);

    try {
      await updateTask({
        id: task.id,
        payload: {
          ACCOMPLICES: newAssistants.map((a) => a.id),
        },
      });
    } catch (error) {
      setAssistants(previousAssistants);
      console.error('Ошибка при обновлении помощников:', error);
      toast.error('Не удалось обновить помощников');
    }
  };

  const handleUpdateLeader = async (newLeader: Member[]) => {
    const previousLeader = leader;
    setLeader(newLeader);

    try {
      await updateTask({
        id: task.id,
        payload: {
          CREATED_BY: newLeader[0]?.id,
        },
      });
    } catch (error) {
      setLeader(previousLeader);
      console.error('Ошибка при обновлении руководителя:', error);
      toast.error('Не удалось обновить руководителя');
    }
  };

  const handleUpdateWatchers = async (newWatchers: Member[]) => {
    const previousWatchers = watchers;
    setWatchers(newWatchers);

    try {
      await updateTask({
        id: task.id,
        payload: {
          AUDITORS: newWatchers.map((w) => w.id),
        },
      });
    } catch (error) {
      setWatchers(previousWatchers);
      console.error('Ошибка при обновлении наблюдателей:', error);
      toast.error('Не удалось обновить наблюдателей');
    }
  };

  // Обертки для совместимости с типом onChange
  const handleMainChange = (newValue: SetStateAction<Member[]>) => {
    const newMain = typeof newValue === 'function' ? newValue(main) : newValue;
    handleUpdateMain(newMain);
    toast.success('Главный успешно изменён');
  };

  const handleAssistantsChange = (newValue: SetStateAction<Member[]>) => {
    const newAssistants =
      typeof newValue === 'function' ? newValue(assistants) : newValue;
    handleUpdateAssistants(newAssistants);
    toast.success('Помощник успешно изменён');
  };

  const handleLeaderChange = (newValue: SetStateAction<Member[]>) => {
    const newLeader =
      typeof newValue === 'function' ? newValue(leader) : newValue;
    handleUpdateLeader(newLeader);
    toast.success('Руководитель успешно изменён');
  };

  const handleWatchersChange = (newValue: SetStateAction<Member[]>) => {
    const newWatchers =
      typeof newValue === 'function' ? newValue(watchers) : newValue;
    handleUpdateWatchers(newWatchers);
    toast.success('Наблюдатель успешно изменён');
  };

  return (
    <WindowCard titleClassName="text-white" title="Команда" onClose={onClose}>
      <div className="space-y-6">
        <MultiSelectSearch
          label="Главный"
          items={allUsers}
          selected={main}
          onChange={handleMainChange}
          multiple={false}
        />

        <MultiSelectSearch
          label="Помощники"
          multiple={true}
          selected={assistants}
          onChange={handleAssistantsChange}
          items={allUsers}
        />

        <MultiSelectSearch
          disabled
          label="Руководитель"
          items={allUsers}
          selected={leader}
          onChange={handleLeaderChange}
          multiple={false}
        />

        <MultiSelectSearch
          label="Наблюдатели"
          multiple={true}
          selected={watchers}
          onChange={handleWatchersChange}
          items={allUsers}
        />
      </div>
    </WindowCard>
  );
}
