// components/fields/ParentTaskField.tsx
import { useQuery } from '@tanstack/react-query';
import { FolderTree, X } from 'lucide-react';
import { useClickOutside } from '../../../../../hooks/ui/useClickOutside';
import { fetchTasks } from '../../../../../lib/api/tasks/tasks';
import { TaskFormSetValue } from '../../../../../shared/types/fields';
import Input from '../../../../../ui/Input';
import { getTaskDisplayName } from '../../../../../utils/displayUtils';

interface ParentTaskFieldProps {
  parentTaskSearch: string;
  setParentTaskSearch: (value: string) => void;
  setShowParentTaskDropdown: (value: boolean) => void;
  showParentTaskDropdown: boolean;
  allTasks: ANY[];
  setValue: TaskFormSetValue;
}

export const ParentTaskField = ({
  parentTaskSearch,
  setParentTaskSearch,
  setShowParentTaskDropdown,
  showParentTaskDropdown,
  allTasks,
  setValue,
}: ParentTaskFieldProps) => {
  const parentTaskDropdownRef = useClickOutside(() =>
    setShowParentTaskDropdown(false)
  );

  const { isLoading: parentTasksLoading } = useQuery({
    queryKey: ['parent-tasks', parentTaskSearch],
    queryFn: async () => {
      const result = await fetchTasks({ search: parentTaskSearch });
      return result;
    },
    enabled: parentTaskSearch.length > 1,
  });

  // Показываем задачи из allTasks при пустом поиске, иначе фильтруем
  const filteredParentTasks = parentTaskSearch
    ? allTasks
        .filter((task) =>
          getTaskDisplayName(task)
            .toLowerCase()
            .includes(parentTaskSearch.toLowerCase())
        )
        .slice(0, 10)
    : allTasks.slice(0, 10); // Показываем первые 10 задач при пустом поиске

  const displayTasks = filteredParentTasks;

  return (
    <div className="relative" ref={parentTaskDropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
        <FolderTree className="h-4 w-4" /> Родительская задача
      </label>
      <div className="relative">
        <Input
          placeholder="Введите название родительской задачи..."
          value={parentTaskSearch}
          onChange={(e) => {
            setParentTaskSearch(e.target.value);
            setShowParentTaskDropdown(true);
          }}
          onFocus={() => setShowParentTaskDropdown(true)}
        />
        {parentTaskSearch && (
          <button
            type="button"
            onClick={() => {
              setParentTaskSearch('');
              setValue('PARENT_ID', null);
              setShowParentTaskDropdown(true); // Оставляем дропдаун открытым после очистки
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Показываем дропдаун всегда когда showParentTaskDropdown = true */}
      {showParentTaskDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow max-h-48 overflow-auto text-sm">
          {parentTasksLoading && parentTaskSearch.length > 1 ? (
            <div className="px-3 py-2 text-gray-500">Загрузка...</div>
          ) : displayTasks.length === 0 ? (
            <div className="px-3 py-2 text-gray-500">
              {parentTaskSearch ? 'Задачи не найдены' : 'Нет доступных задач'}
            </div>
          ) : (
            displayTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className="w-full text-left px-3 py-1.5 hover:bg-gray-100"
                onClick={() => {
                  setValue('PARENT_ID', Number(task.id));
                  setParentTaskSearch(getTaskDisplayName(task));
                  setShowParentTaskDropdown(false);
                }}
              >
                {getTaskDisplayName(task)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
