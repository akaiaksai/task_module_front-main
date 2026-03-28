// components/fields/AccomplicesField.tsx
import { Users, X } from 'lucide-react';
import { useClickOutside } from '../../../../../hooks/ui/useClickOutside';
import { User } from '../../../../../lib/api/users';
import { TaskFormSetValue } from '../../../../../shared/types/fields';
import Input from '../../../../../ui/Input';
import { getUserDisplayName } from '../../../../../utils/displayUtils';

interface AccomplicesFieldProps {
  accompliceSearch: string;
  setAccompliceSearch: (value: string) => void;
  setShowAccompliceDropdown: (value: boolean) => void;
  showAccompliceDropdown: boolean;
  allUsers: User[];
  accomplices: number[];
  responsibleId: number;
  setValue: TaskFormSetValue;
}

export const AccomplicesField = ({
  accompliceSearch,
  setAccompliceSearch,
  setShowAccompliceDropdown,
  showAccompliceDropdown,
  allUsers,
  accomplices,
  responsibleId,
  setValue,
}: AccomplicesFieldProps) => {
  const accompliceDropdownRef = useClickOutside(() =>
    setShowAccompliceDropdown(false)
  );

  const filteredAccompliceUsers = allUsers.filter(
    (user) =>
      getUserDisplayName(user)
        .toLowerCase()
        .includes(accompliceSearch.toLowerCase()) &&
      !accomplices.includes(user.ID) &&
      user.ID !== responsibleId
  );

  return (
    <div className="relative" ref={accompliceDropdownRef}>
      <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
        <Users className="h-4 w-4" /> Соисполнители
      </label>
      <Input
        placeholder="Добавьте соисполнителей..."
        value={accompliceSearch}
        onChange={(e) => {
          setAccompliceSearch(e.target.value);
          setShowAccompliceDropdown(true);
        }}
        onFocus={() => setShowAccompliceDropdown(true)}
      />
      {showAccompliceDropdown && accompliceSearch && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow max-h-48 overflow-auto text-sm">
          {filteredAccompliceUsers.map((user) => (
            <button
              key={user.ID}
              type="button"
              className="w-full text-left px-3 py-1.5 hover:bg-gray-100"
              onClick={() => {
                setValue('ACCOMPLICES', [...accomplices, user.ID]);
                setAccompliceSearch('');
                setShowAccompliceDropdown(false);
              }}
            >
              {getUserDisplayName(user)}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1 mt-2">
        {accomplices.map((userId) => {
          const user = allUsers.find((u) => u.ID === userId);
          if (!user) {
            return null;
          }

          return (
            <span
              key={userId}
              className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full"
            >
              {getUserDisplayName(user)}
              <button
                type="button"
                onClick={() => {
                  setValue(
                    'ACCOMPLICES',
                    accomplices.filter((id) => id !== userId)
                  );
                }}
                className="hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
};
