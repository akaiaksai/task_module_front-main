// hooks/useTaskFormData.ts
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { fetchGroups } from '../../../lib/api/group';
import { fetchUsers } from '../../../lib/api/users';
import {
  getNumberValue,
  getStringValue,
  normalizeIdArray,
  normalizeStringArray,
} from '../../../utils/dataNormalizers';
import { useCRMSmartContracts } from '../../crm/useCRMSmartContracts';
import { useAllTasks } from '../useTaskActions';

// Функция для получения аббревиатуры смарт-контракта
const getSmartContractAbbr = (contract: ANY): string => {
  const entityTypeId = contract.EntityTypeID || 0;
  const hex = entityTypeId.toString(16).toLowerCase();
  return `T${hex}`;
};

export const useTaskFormData = (initialData?: ANY) => {
  const { data: allUsersData } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => fetchUsers(''),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allGroupsData } = useQuery({
    queryKey: ['groups'],
    queryFn: () => fetchGroups(''),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allTasksData } = useAllTasks();
  const { smartContracts } = useCRMSmartContracts();

  const parentId = useMemo(() => {
    if (!initialData) {
      return null;
    }
    return getNumberValue(initialData.PARENT_ID);
  }, [initialData]);

  const parentTaskData = useMemo(() => {
    if (!parentId || !allTasksData) {
      return null;
    }

    return (
      allTasksData.find((task) => {
        const taskId = getNumberValue(task.id);
        return taskId === parentId;
      }) || null
    );
  }, [parentId, allTasksData]);

  const findRelatedData = useCallback(() => {
    if (!initialData) {
      return null;
    }

    const responsibleId = getNumberValue(initialData.RESPONSIBLE_ID);
    const groupId = getNumberValue(initialData.GROUP_ID);
    const accompliceIds = normalizeIdArray(initialData.ACCOMPLICES);
    const auditorIds = normalizeIdArray(initialData.AUDITORS);
    const crmValues = normalizeStringArray(initialData.UF_CRM_TASK);

    const responsibleUser = allUsersData?.result?.find(
      (user) => user.ID === responsibleId
    );
    const group = allGroupsData?.result?.find(
      (group) => getNumberValue(group.ID) === groupId
    );

    const accompliceUsers =
      allUsersData?.result?.filter((user) => accompliceIds.includes(user.ID)) ||
      [];

    const auditorUsers =
      allUsersData?.result?.filter((user) => auditorIds.includes(user.ID)) ||
      [];

    // Обрабатываем смарт-контракты: сначала проверяем project, потом UF_CRM_TASK
    const crmSmartContracts = [];

    // Если есть project в данных задачи, используем его
    if (initialData.project) {
      const abbr = getSmartContractAbbr(initialData.project);
      const crmValue = `${abbr}_${initialData.project.ID}`;
      crmSmartContracts.push({
        id: crmValue,
        title: getStringValue(initialData.project.Title),
        contractId: initialData.project.ID,
        entityTypeId: initialData.project.EntityTypeID,
      });
    }
    // Иначе используем данные из UF_CRM_TASK
    else if (crmValues.length > 0) {
      crmSmartContracts.push(
        ...crmValues
          .map((value) => {
            if (value.startsWith('T')) {
              // Парсим значение в формате "T43c_21"
              const parts = value.split('_');
              if (parts.length === 2) {
                // COMMENT
                // const prefix = parts[0];
                const contractId = parseInt(parts[1]);
                const contract = smartContracts.find(
                  (c) => c.ID === contractId
                );
                return contract
                  ? {
                      id: value,
                      title: getStringValue(contract.Title),
                      contractId,
                      entityTypeId: contract.EntityTypeID,
                    }
                  : null;
              }
            }
            return null;
          })
          .filter(Boolean)
      );
    }

    return {
      responsibleUser,
      group,
      accompliceUsers,
      auditorUsers,
      crmSmartContracts,
      parentTask: parentTaskData || null,
    };
  }, [
    initialData,
    allUsersData,
    allGroupsData,
    smartContracts,
    parentTaskData,
  ]);

  return {
    allUsers: allUsersData?.result || [],
    allGroups: allGroupsData?.result || [],
    smartContracts,
    allTasks: allTasksData || [],
    relatedData: findRelatedData(),
  };
};
