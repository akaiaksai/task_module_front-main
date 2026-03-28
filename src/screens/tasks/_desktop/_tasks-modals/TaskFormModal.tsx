// components/TaskFormModal.tsx
import { Check, Clock } from 'lucide-react';
import { useMemo } from 'react';
import { useTaskForm } from '../../../../hooks/tasks/forms/useTaskForm';
import Button from '../../../../ui/Button';
import Input from '../../../../ui/Input';
import Modal from '../../../../ui/Modal';
import Textarea from '../../../../ui/Textarea';
import { getNumberValue } from '../../../../utils/dataNormalizers';
import { getGroupDisplayName } from '../../../../utils/displayUtils';
import { AccomplicesField } from './fields/AccomplicesField';
import { AuditorsField } from './fields/AuditorsField';
import { GroupSearchField } from './fields/GroupSearchField';
import { ParentTaskField } from './fields/ParentTaskField';
import { SmartContractSearchField } from './fields/SmartContractField';
import { TagsField } from './fields/TagsField';
import { UserSearchField } from './fields/UserSearchField';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ANY) => Promise<void>;
  initialData?: ANY;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

// Конфигурация быстрых групп
const QUICK_GROUPS = [
  {
    id: 'our-system',
    displayName: 'CG System',
    searchTerms: ['our system'],
  },
];

type QuickGroupWithGroup = {
  id: string;
  displayName: string;
  searchTerms: string[];
  group: ANY; // Группа гарантированно существует
};

export default function TaskFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  mode = 'create',
}: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    errors,
    allUsers,
    allGroups,
    smartContracts,
    allTasks,
    userSearch,
    groupSearch,
    parentTaskSearch,
    tagInput,
    smartContractSearch,
    accompliceSearch,
    auditorSearch,
    showUserDropdown,
    showGroupDropdown,
    showParentTaskDropdown,
    showSmartContractDropdown,
    showAccompliceDropdown,
    showAuditorDropdown,
    responsibleId,
    accomplices,
    auditors,
    tags,
    ufCrmTask,
    setUserSearch,
    setGroupSearch,
    setParentTaskSearch,
    setTagInput,
    setSmartContractSearch,
    setAccompliceSearch,
    setAuditorSearch,
    setShowUserDropdown,
    setShowGroupDropdown,
    setShowParentTaskDropdown,
    setShowSmartContractDropdown,
    setShowAccompliceDropdown,
    setShowAuditorDropdown,
  } = useTaskForm({
    open,
    initialData,
    mode,
    onSubmit,
    onClose,
  });

  // Получаем быстрые группы, которые существуют в системе
  const quickGroups = useMemo((): QuickGroupWithGroup[] => {
    return QUICK_GROUPS.map((quickGroup) => {
      const existingGroup = allGroups.find((g) =>
        getGroupDisplayName(g)
          .toLowerCase()
          .includes(quickGroup.searchTerms[0].toLowerCase())
      );

      if (existingGroup) {
        return {
          ...quickGroup,
          group: existingGroup,
        };
      }
      return null;
    }).filter((group): group is QuickGroupWithGroup => group !== null);
  }, [allGroups]);

  // Находим активную быструю группу
  const activeQuickGroup = useMemo(() => {
    return quickGroups.find((quickGroup) =>
      quickGroup.searchTerms.some((term) =>
        groupSearch.toLowerCase().includes(term.toLowerCase())
      )
    );
  }, [groupSearch, quickGroups]);

  const handleQuickGroupToggle = (quickGroup: QuickGroupWithGroup) => {
    if (activeQuickGroup?.id === quickGroup.id) {
      // Снимаем выбор, если кликаем на активную группу
      setGroupSearch('');
      setValue('GROUP_ID', null);
    } else {
      // Выбираем новую группу
      setValue('GROUP_ID', getNumberValue(quickGroup.group.ID));
      setGroupSearch(getGroupDisplayName(quickGroup.group));
      setShowGroupDropdown(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Создание задачи' : 'Редактирование задачи'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Название */}
        <div>
          <label
            htmlFor="TITLE"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Название задачи *
          </label>
          <Input
            id="TITLE"
            placeholder="Введите название задачи"
            {...register('TITLE')}
            className={errors.TITLE ? 'border-red-500 focus:ring-red-200' : ''}
          />
          {errors.TITLE && (
            <p className="text-xs text-red-500 mt-1">{errors.TITLE.message}</p>
          )}
        </div>

        {/* Описание */}
        <div>
          <label
            htmlFor="DESCRIPTION"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Описание
          </label>
          <Textarea
            id="DESCRIPTION"
            placeholder="Введите описание задачи"
            rows={3}
            {...register('DESCRIPTION')}
          />
        </div>

        {/* Ответственный / Группа / Время */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UserSearchField
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            setShowUserDropdown={setShowUserDropdown}
            showUserDropdown={showUserDropdown}
            allUsers={allUsers}
            setValue={setValue}
            error={errors.RESPONSIBLE_ID}
          />

          <GroupSearchField
            groupSearch={groupSearch}
            setGroupSearch={setGroupSearch}
            setShowGroupDropdown={setShowGroupDropdown}
            showGroupDropdown={showGroupDropdown}
            allGroups={allGroups}
            setValue={setValue}
          />

          {/* Время */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Clock className="h-4 w-4" /> Время
            </label>
            <div className="flex gap-1">
              <Input
                type="number"
                placeholder="ч"
                min="0"
                max="1000"
                value={watch('TIME_ESTIMATE_HOURS') || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setValue(
                    'TIME_ESTIMATE_HOURS',
                    value === '' ? undefined : parseInt(value),
                    { shouldValidate: true }
                  );
                }}
              />
              <Input
                type="number"
                placeholder="мин"
                min="0"
                max="59"
                value={watch('TIME_ESTIMATE_MINUTES') || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setValue(
                    'TIME_ESTIMATE_MINUTES',
                    value === '' ? undefined : parseInt(value),
                    { shouldValidate: true }
                  );
                }}
              />
            </div>
          </div>
        </div>

        {/* Родительская задача */}
        <ParentTaskField
          parentTaskSearch={parentTaskSearch}
          setParentTaskSearch={setParentTaskSearch}
          setShowParentTaskDropdown={setShowParentTaskDropdown}
          showParentTaskDropdown={showParentTaskDropdown}
          allTasks={allTasks}
          setValue={setValue}
        />

        {/* Теги и CRM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TagsField
            tagInput={tagInput}
            setTagInput={setTagInput}
            tags={tags}
            setValue={setValue}
          />

          <SmartContractSearchField
            smartContractSearch={smartContractSearch}
            setSmartContractSearch={setSmartContractSearch}
            setShowSmartContractDropdown={setShowSmartContractDropdown}
            showSmartContractDropdown={showSmartContractDropdown}
            smartContracts={smartContracts}
            ufCrmTask={ufCrmTask}
            setValue={setValue}
          />
        </div>

        {/* Соисполнители и Наблюдатели */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AccomplicesField
            accompliceSearch={accompliceSearch}
            setAccompliceSearch={setAccompliceSearch}
            setShowAccompliceDropdown={setShowAccompliceDropdown}
            showAccompliceDropdown={showAccompliceDropdown}
            allUsers={allUsers}
            accomplices={accomplices}
            responsibleId={responsibleId}
            setValue={setValue}
          />

          <AuditorsField
            auditorSearch={auditorSearch}
            setAuditorSearch={setAuditorSearch}
            setShowAuditorDropdown={setShowAuditorDropdown}
            showAuditorDropdown={showAuditorDropdown}
            allUsers={allUsers}
            auditors={auditors}
            responsibleId={responsibleId}
            setValue={setValue}
          />
        </div>

        {/* Дедлайн */}
        <div>
          <label
            htmlFor="DEADLINE"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Дедлайн
          </label>
          <Input
            id="DEADLINE"
            type="datetime-local"
            {...register('DEADLINE')}
          />
        </div>

        {/* Быстрые группы - показываем только существующие */}
        {quickGroups.length > 0 && (
          <div className="pt-2 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Быстрый выбор групп:
            </label>
            <div className="flex flex-wrap gap-2">
              {quickGroups.map((quickGroup) => {
                const isActive = activeQuickGroup?.id === quickGroup.id;
                return (
                  <button
                    key={quickGroup.id}
                    type="button"
                    onClick={() => handleQuickGroupToggle(quickGroup)}
                    className={`self-start flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors ${
                      isActive
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {isActive && <Check className="w-4 h-4" />}
                    {quickGroup.displayName}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={onClose} disabled={isLoading}>
            Отмена
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? mode === 'create'
                ? 'Создание...'
                : 'Сохранение...'
              : mode === 'create'
                ? 'Создать'
                : 'Сохранить'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
