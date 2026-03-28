// components/fields/GroupSearchField.tsx
import { X } from 'lucide-react';
import { useClickOutside } from '../../../../../hooks/ui/useClickOutside';
import { TaskFormSetValue } from '../../../../../shared/types/fields';
import Input from '../../../../../ui/Input';
import { getNumberValue } from '../../../../../utils/dataNormalizers';
import { getGroupDisplayName } from '../../../../../utils/displayUtils';

interface GroupSearchFieldProps {
  groupSearch: string;
  setGroupSearch: (value: string) => void;
  setShowGroupDropdown: (value: boolean) => void;
  showGroupDropdown: boolean;
  allGroups: ANY[];
  setValue: TaskFormSetValue;
}

export const GroupSearchField = ({
  groupSearch,
  setGroupSearch,
  setShowGroupDropdown,
  showGroupDropdown,
  allGroups,
  setValue,
}: GroupSearchFieldProps) => {
  const groupDropdownRef = useClickOutside(() => setShowGroupDropdown(false));

  const handleGroupSearchChange = (value: string) => {
    setGroupSearch(value);
    setShowGroupDropdown(true);
  };

  const filteredGroups = allGroups.filter((group) =>
    getGroupDisplayName(group).toLowerCase().includes(groupSearch.toLowerCase())
  );

  const clearGroupSelection = () => {
    setGroupSearch('');
    setValue('GROUP_ID', null);
    setShowGroupDropdown(false);
  };

  return (
    <div className="relative" ref={groupDropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Группа / Проект
      </label>

      {/* Поле поиска */}
      <div className="relative">
        <Input
          placeholder="Введите группу..."
          value={groupSearch}
          onChange={(e) => handleGroupSearchChange(e.target.value)}
          onFocus={() => setShowGroupDropdown(true)}
        />
        {groupSearch && (
          <button
            type="button"
            onClick={clearGroupSelection}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Выпадающий список */}
      {showGroupDropdown && groupSearch && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow max-h-48 overflow-auto text-sm">
          {filteredGroups.map((group) => (
            <button
              key={getNumberValue(group.ID)}
              type="button"
              className="w-full text-left px-3 py-1.5 hover:bg-gray-100"
              onClick={() => {
                setValue('GROUP_ID', getNumberValue(group.ID));
                setGroupSearch(getGroupDisplayName(group));
                setShowGroupDropdown(false);
              }}
            >
              {getGroupDisplayName(group)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
