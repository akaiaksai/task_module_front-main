// components/fields/AuditorsField.tsx
import { Eye, X } from 'lucide-react';
import { useClickOutside } from '../../../../../hooks/ui/useClickOutside';
import { User } from '../../../../../lib/api/users';
import { TaskFormSetValue } from '../../../../../shared/types/fields';
import Input from '../../../../../ui/Input';
import { getUserDisplayName } from '../../../../../utils/displayUtils';

interface AuditorsFieldProps {
  auditorSearch: string;
  setAuditorSearch: (value: string) => void;
  setShowAuditorDropdown: (value: boolean) => void;
  showAuditorDropdown: boolean;
  allUsers: User[];
  auditors: number[];
  responsibleId: number;
  setValue: TaskFormSetValue;
}

export const AuditorsField = ({
  auditorSearch,
  setAuditorSearch,
  setShowAuditorDropdown,
  showAuditorDropdown,
  allUsers,
  auditors,
  responsibleId,
  setValue,
}: AuditorsFieldProps) => {
  const auditorDropdownRef = useClickOutside(() =>
    setShowAuditorDropdown(false)
  );

  const filteredAuditorUsers = allUsers.filter(
    (user) =>
      getUserDisplayName(user)
        .toLowerCase()
        .includes(auditorSearch.toLowerCase()) &&
      !auditors.includes(user.ID) &&
      user.ID !== responsibleId
  );

  return (
    <div className="relative" ref={auditorDropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
        <Eye className="h-4 w-4" /> Наблюдатели
      </label>
      <Input
        placeholder="Добавьте наблюдателей..."
        value={auditorSearch}
        onChange={(e) => {
          setAuditorSearch(e.target.value);
          setShowAuditorDropdown(true);
        }}
        onFocus={() => setShowAuditorDropdown(true)}
      />
      {showAuditorDropdown && auditorSearch && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow max-h-48 overflow-auto text-sm">
          {filteredAuditorUsers.map((user) => (
            <button
              key={user.ID}
              type="button"
              className="w-full text-left px-3 py-1.5 hover:bg-gray-100"
              onClick={() => {
                setValue('AUDITORS', [...auditors, user.ID]);
                setAuditorSearch('');
                setShowAuditorDropdown(false);
              }}
            >
              {getUserDisplayName(user)}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1 mt-2">
        {auditors.map((userId) => {
          const user = allUsers.find((u) => u.ID === userId);
          if (!user) {
            return null;
          }

          return (
            <span
              key={userId}
              className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full"
            >
              {getUserDisplayName(user)}
              <button
                type="button"
                onClick={() => {
                  setValue(
                    'AUDITORS',
                    auditors.filter((id) => id !== userId)
                  );
                }}
                className="hover:text-green-900"
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
