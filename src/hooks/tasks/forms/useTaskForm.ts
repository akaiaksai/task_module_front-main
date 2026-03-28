// hooks/useTaskForm.ts
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { z } from 'zod';
import { getSmartContractAbbr } from '../../../screens/tasks/_desktop/_tasks-modals/fields/SmartContractField';
import {
  getNumberValue,
  getStringValue,
  hoursAndMinutesToSeconds,
  normalizeIdArray,
  normalizeStringArray,
  normalizeTags,
  secondsToHoursAndMinutes,
} from '../../../utils/dataNormalizers';
import {
  getGroupDisplayName,
  getTaskDisplayName,
  getUserDisplayName,
} from '../../../utils/displayUtils';
import { useDebounced } from '../../ui/useDebounced';
import { useInitializationFlag } from './useInitializationFlag';
import { useTaskFormData } from './useTaskFormData';

export type TaskFormSetValue = UseFormSetValue<TaskFormData>;
export type TaskFormWatch = UseFormWatch<TaskFormData>;

export const taskFormSchema = z.object({
  TITLE: z.string().min(1, 'Название задачи обязательно'),
  DESCRIPTION: z.string().optional(),
  RESPONSIBLE_ID: z.number().min(1, 'ID ответственного обязательно'),
  GROUP_ID: z.number().optional().nullable(),
  DEADLINE: z.string().optional(),
  ACCOMPLICES: z.array(z.number()).optional(),
  AUDITORS: z.array(z.number()).optional(),
  PARENT_ID: z.number().optional().nullable(),
  TIME_ESTIMATE_HOURS: z
    .number()
    .min(0, 'Часы не могут быть отрицательными')
    .max(1000, 'Слишком большое значение часов')
    .optional(),
  TIME_ESTIMATE_MINUTES: z
    .number()
    .min(0, 'Минуты не могут быть отрицательными')
    .max(59, 'Минуты не могут превышать 59')
    .optional(),
  TAGS: z.array(z.string()).optional(),
  UF_CRM_TASK: z.array(z.string()).optional(),
});

export type TaskFormData = z.infer<typeof taskFormSchema>;

interface UseTaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ANY) => void;
  mode: 'create' | 'edit';
  initialData?: ANY; // необязательный
}

// Функция для создания уникального ключа смарт-контракта
const getSmartContractKey = (contract: ANY): string => {
  const id = contract.ID;
  const entityTypeId = contract.EntityTypeID || 0;
  return `SC_${entityTypeId}_${id}`;
};

export const useTaskForm = ({
  open,
  initialData,
  mode = 'create',
  onSubmit,
  onClose,
}: UseTaskFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      TITLE: '',
      DESCRIPTION: '',
      RESPONSIBLE_ID: 0,
      GROUP_ID: null,
      DEADLINE: '',
      TIME_ESTIMATE_HOURS: undefined,
      TIME_ESTIMATE_MINUTES: undefined,
      ACCOMPLICES: [],
      AUDITORS: [],
      PARENT_ID: null,
      TAGS: [],
      UF_CRM_TASK: [],
    },
  });

  const { allUsers, allGroups, smartContracts, allTasks, relatedData } =
    useTaskFormData(initialData);

  const [userSearch, setUserSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [accompliceSearch, setAccompliceSearch] = useState('');
  const [auditorSearch, setAuditorSearch] = useState('');
  const [parentTaskSearch, setParentTaskSearch] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [smartContractSearch, setSmartContractSearch] = useState('');

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showAccompliceDropdown, setShowAccompliceDropdown] = useState(false);
  const [showAuditorDropdown, setShowAuditorDropdown] = useState(false);
  const [showParentTaskDropdown, setShowParentTaskDropdown] = useState(false);
  const [showSmartContractDropdown, setShowSmartContractDropdown] =
    useState(false);

  const debouncedUserSearch = useDebounced(userSearch, 400);
  const debouncedGroupSearch = useDebounced(groupSearch, 400);
  const debouncedAccompliceSearch = useDebounced(accompliceSearch, 400);
  const debouncedAuditorSearch = useDebounced(auditorSearch, 400);
  const debouncedParentTaskSearch = useDebounced(parentTaskSearch, 400);
  const debouncedSmartContractSearch = useDebounced(smartContractSearch, 400);

  // Watch form values
  const responsibleId = watch('RESPONSIBLE_ID');
  const accomplices = watch('ACCOMPLICES') || [];
  const auditors = watch('AUDITORS') || [];
  const tags = watch('TAGS') || [];
  const ufCrmTask = watch('UF_CRM_TASK') || [];

  // Хук для отслеживания инициализации
  const { isInitialized, markAsInitialized, resetInitialization } =
    useInitializationFlag();

  // Фильтрация данных
  const filteredUsers = useMemo(
    () =>
      allUsers.filter((user) =>
        getUserDisplayName(user)
          .toLowerCase()
          .includes(debouncedUserSearch.toLowerCase())
      ),
    [allUsers, debouncedUserSearch]
  );

  const filteredGroups = useMemo(
    () =>
      allGroups.filter((group) =>
        getGroupDisplayName(group)
          .toLowerCase()
          .includes(debouncedGroupSearch.toLowerCase())
      ),
    [allGroups, debouncedGroupSearch]
  );

  const filteredAccompliceUsers = useMemo(
    () =>
      allUsers.filter(
        (user) =>
          getUserDisplayName(user)
            .toLowerCase()
            .includes(debouncedAccompliceSearch.toLowerCase()) &&
          !accomplices.includes(user.ID)
      ),
    [allUsers, debouncedAccompliceSearch, accomplices]
  );

  const filteredAuditorUsers = useMemo(
    () =>
      allUsers.filter(
        (user) =>
          getUserDisplayName(user)
            .toLowerCase()
            .includes(debouncedAuditorSearch.toLowerCase()) &&
          !auditors.includes(user.ID)
      ),
    [allUsers, debouncedAuditorSearch, auditors]
  );

  const filteredSmartContracts = useMemo(() => {
    if (!debouncedSmartContractSearch.trim()) {
      return smartContracts.filter(
        (contract) => !ufCrmTask.includes(getSmartContractKey(contract))
      );
    }

    return smartContracts.filter(
      (contract) =>
        getStringValue(contract.Title)
          .toLowerCase()
          .includes(debouncedSmartContractSearch.toLowerCase()) &&
        !ufCrmTask.includes(getSmartContractKey(contract))
    );
  }, [smartContracts, debouncedSmartContractSearch, ufCrmTask]);

  const filteredParentTasks = useMemo(
    () =>
      allTasks
        .filter((task) =>
          getTaskDisplayName(task)
            .toLowerCase()
            .includes(debouncedParentTaskSearch.toLowerCase())
        )
        .slice(0, 10),
    [allTasks, debouncedParentTaskSearch]
  );

  // Обработчик отправки формы
  const handleFormSubmit = async (data: TaskFormData) => {
    if (data.DEADLINE) {
      const parsedDate = parseISO(data.DEADLINE);
      data.DEADLINE = parsedDate.toISOString();
    }

    const timeEstimateSeconds = hoursAndMinutesToSeconds(
      data.TIME_ESTIMATE_HOURS,
      data.TIME_ESTIMATE_MINUTES
    );

    const submitData = {
      ...data,
      GROUP_ID: data.GROUP_ID || null,
      PARENT_ID: data.PARENT_ID || null,
      TIME_ESTIMATE: timeEstimateSeconds > 0 ? timeEstimateSeconds : undefined,
      TAGS: data.TAGS || [],
      UF_CRM_TASK: data.UF_CRM_TASK || [],
    };

    await onSubmit(submitData);
    onClose();
  };

  // Инициализация формы
  useEffect(() => {
    if (!open) {
      resetInitialization();
      return;
    }

    if (!isInitialized) {
      if (mode === 'create') {
        const createData = {
          TITLE: '',
          DESCRIPTION: '',
          RESPONSIBLE_ID: 0,
          GROUP_ID: null,
          DEADLINE: '',
          TIME_ESTIMATE_HOURS: undefined,
          TIME_ESTIMATE_MINUTES: undefined,
          ACCOMPLICES: [],
          AUDITORS: [],
          PARENT_ID: null,
          TAGS: [],
          UF_CRM_TASK: [],
          ...(initialData || {}),
        };

        reset(createData);

        // Устанавливаем поиск для родительской задачи если есть PARENT_ID в initialData
        if (initialData?.PARENT_ID) {
          const parentId = getNumberValue(initialData.PARENT_ID);
          if (parentId) {
            setParentTaskSearch(`Задача #${parentId}`);
          }
        }
      } else if (mode === 'edit' && initialData) {
        const timeEstimateSeconds = initialData.TIME_ESTIMATE;
        const { hours, minutes } =
          secondsToHoursAndMinutes(timeEstimateSeconds);

        // Сначала формируем базовые данные формы
        const formData: TaskFormData = {
          TITLE: getStringValue(initialData.TITLE),
          DESCRIPTION: getStringValue(initialData.DESCRIPTION),
          RESPONSIBLE_ID: getNumberValue(initialData.RESPONSIBLE_ID) || 0,
          GROUP_ID: getNumberValue(initialData.GROUP_ID) || null,
          DEADLINE: initialData.DEADLINE
            ? format(parseISO(initialData.DEADLINE), "yyyy-MM-dd'T'HH:mm")
            : '',
          ACCOMPLICES: normalizeIdArray(initialData.ACCOMPLICES),
          AUDITORS: normalizeIdArray(initialData.AUDITORS),
          PARENT_ID: getNumberValue(initialData.PARENT_ID) || null,
          TAGS: normalizeTags(initialData.TAGS),
          UF_CRM_TASK: normalizeStringArray(initialData.UF_CRM_TASK),
          TIME_ESTIMATE_HOURS: hours || undefined,
          TIME_ESTIMATE_MINUTES: minutes || undefined,
        };

        // Если есть project в данных задачи, обновляем UF_CRM_TASK
        console.log(initialData);

        if (initialData.project) {
          const abbr = getSmartContractAbbr(initialData.project);
          const crmValue = `${abbr}_${initialData.project.ID}`;
          formData.UF_CRM_TASK = [crmValue];

          // Также устанавливаем поисковую строку для немедленного отображения
          setSmartContractSearch(getStringValue(initialData.project.Title));
        }

        reset(formData);

        // Устанавливаем начальные значения поиска на основе ID
        const parentId = getNumberValue(initialData.PARENT_ID);
        if (parentId) {
          setParentTaskSearch(`Задача #${parentId}`);
        }

        const responsibleId = getNumberValue(initialData.RESPONSIBLE_ID);
        if (responsibleId) {
          // Показываем ID, потом заменим на имя когда загрузится
          setUserSearch(`ID: ${responsibleId}`);
        }

        const groupId = getNumberValue(initialData.GROUP_ID);
        if (groupId) {
          // Показываем ID, потом заменим на название когда загрузится
          setGroupSearch(`ID: ${groupId}`);
        }
      }

      markAsInitialized();
    }
  }, [
    open,
    mode,
    initialData,
    reset,
    isInitialized,
    markAsInitialized,
    resetInitialization,
  ]);
  useEffect(() => {
    if (!open) {
      return;
    }

    // Обновляем ответственного
    if (responsibleId && allUsers.length > 0) {
      const user = allUsers.find((u) => u.ID === responsibleId);
      if (user && userSearch === `ID: ${responsibleId}`) {
        setUserSearch(getUserDisplayName(user));
      }
    }

    const groupId = watch('GROUP_ID');
    if (groupId && allGroups.length > 0) {
      const group = allGroups.find((g) => getNumberValue(g.ID) === groupId);
      if (group && groupSearch === `ID: ${groupId}`) {
        setGroupSearch(getGroupDisplayName(group));
      }
    }

    const parentId = watch('PARENT_ID');
    if (
      parentId &&
      allTasks.length > 0 &&
      parentTaskSearch.startsWith('Задача #')
    ) {
      const task = allTasks.find((t) => getNumberValue(t.id) === parentId);
      if (task) {
        const realTitle = getTaskDisplayName(task);
        if (realTitle && realTitle !== parentTaskSearch) {
          setParentTaskSearch(realTitle);
        }
      }
    }
  }, [
    open,
    responsibleId,
    allUsers,
    allGroups,
    allTasks,
    userSearch,
    groupSearch,
    parentTaskSearch,
    watch,
  ]);

  // Эффект для обновления названий из relatedData (для режима редактирования)
  useEffect(() => {
    if (!open || mode !== 'edit' || !relatedData) {
      return;
    }

    // Обновляем ответственного из relatedData
    if (relatedData.responsibleUser && userSearch.startsWith('ID: ')) {
      setUserSearch(getUserDisplayName(relatedData.responsibleUser));
    }

    // Обновляем группу из relatedData
    if (relatedData.group && groupSearch.startsWith('ID: ')) {
      setGroupSearch(getGroupDisplayName(relatedData.group));
    }

    // Обновляем родительскую задачу из relatedData
    if (relatedData.parentTask && parentTaskSearch.startsWith('Задача #')) {
      const realTitle = getTaskDisplayName(relatedData.parentTask);
      if (realTitle && realTitle !== parentTaskSearch) {
        setParentTaskSearch(realTitle);
      }
    }
  }, [open, mode, relatedData, userSearch, groupSearch, parentTaskSearch]);

  // Обработчики изменений
  const handleUserSearchChange = useCallback((value: string) => {
    setUserSearch(value);
    setShowUserDropdown(true);
  }, []);

  const handleGroupSearchChange = useCallback((value: string) => {
    setGroupSearch(value);
    setShowGroupDropdown(true);
  }, []);

  const handleParentTaskSearchChange = useCallback((value: string) => {
    setParentTaskSearch(value);
    setShowParentTaskDropdown(true);
  }, []);

  const handleSmartContractSearchChange = useCallback((value: string) => {
    setSmartContractSearch(value);
    setShowSmartContractDropdown(true);
  }, []);

  const addTag = useCallback(() => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setValue('TAGS', newTags);
      setTagInput('');
    }
  }, [tagInput, tags, setValue]);

  const removeTag = useCallback(
    (tagToRemove: string) => {
      const newTags = tags.filter((tag) => tag !== tagToRemove);
      setValue('TAGS', newTags);
    },
    [tags, setValue]
  );

  // Функции для работы со смарт-контрактами
  const addSmartContract = useCallback(
    (contract: ANY) => {
      const crmValue = getSmartContractKey(contract);
      if (!ufCrmTask.includes(crmValue)) {
        const newCrmTasks = [...ufCrmTask, crmValue];
        setValue('UF_CRM_TASK', newCrmTasks);
      }
      setSmartContractSearch('');
      setShowSmartContractDropdown(false);
    },
    [ufCrmTask, setValue]
  );

  const removeSmartContract = useCallback(
    (crmValue: string) => {
      const newCrmTasks = ufCrmTask.filter((item) => item !== crmValue);
      setValue('UF_CRM_TASK', newCrmTasks);
    },
    [ufCrmTask, setValue]
  );

  return {
    // Form methods
    register,
    handleSubmit: handleSubmit(handleFormSubmit),
    setValue: setValue as TaskFormSetValue,
    watch,
    errors,

    // Data
    allUsers,
    allGroups,
    allTasks,
    relatedData,
    smartContracts,

    // Filtered data
    filteredUsers,
    filteredGroups,
    filteredAccompliceUsers,
    filteredAuditorUsers,
    filteredSmartContracts,
    filteredParentTasks,

    // Search states
    userSearch,
    groupSearch,
    accompliceSearch,
    auditorSearch,
    parentTaskSearch,
    tagInput,
    smartContractSearch,

    // Dropdown states
    showUserDropdown,
    showGroupDropdown,
    showAccompliceDropdown,
    showAuditorDropdown,
    showParentTaskDropdown,
    showSmartContractDropdown,

    // Form values
    responsibleId,
    accomplices,
    auditors,
    tags,
    ufCrmTask,

    // Setters
    setUserSearch,
    setGroupSearch,
    setAccompliceSearch,
    setAuditorSearch,
    setParentTaskSearch,
    setTagInput,
    setSmartContractSearch,
    setShowUserDropdown,
    setShowGroupDropdown,
    setShowAccompliceDropdown,
    setShowAuditorDropdown,
    setShowParentTaskDropdown,
    setShowSmartContractDropdown,

    // Handlers
    handleUserSearchChange,
    handleGroupSearchChange,
    handleParentTaskSearchChange,
    handleSmartContractSearchChange,
    addTag,
    removeTag,
    addSmartContract,
    removeSmartContract,
  };
};
