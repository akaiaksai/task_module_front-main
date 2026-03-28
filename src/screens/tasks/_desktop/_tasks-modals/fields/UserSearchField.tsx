// components/fields/UserSearchField.tsx
import { useClickOutside } from '../../../../../hooks/ui/useClickOutside';
import { User } from '../../../../../lib/api/users';
import { TaskFormSetValue } from '../../../../../shared/types/fields';
import Input from '../../../../../ui/Input';
import { getUserDisplayName } from '../../../../../utils/displayUtils';

interface UserSearchFieldProps {
  userSearch: string;
  setUserSearch: (value: string) => void;
  setShowUserDropdown: (value: boolean) => void;
  showUserDropdown: boolean;
  allUsers: User[];
  setValue: TaskFormSetValue;
  error?: ANY;
}

export const UserSearchField = ({
  userSearch,
  setUserSearch,
  setShowUserDropdown,
  showUserDropdown,
  allUsers,
  setValue,
  error,
}: UserSearchFieldProps) => {
  const userDropdownRef = useClickOutside(() => setShowUserDropdown(false));

  const handleUserSearchChange = (value: string) => {
    setUserSearch(value);
    setShowUserDropdown(true);
  };

  const filteredUsers = allUsers.filter((user) =>
    getUserDisplayName(user).toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="relative" ref={userDropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Ответственный *
      </label>
      <Input
        placeholder="Введите имя..."
        value={userSearch}
        onChange={(e) => handleUserSearchChange(e.target.value)}
        onFocus={() => setShowUserDropdown(true)}
        className={error ? 'border-red-500 focus:ring-red-200' : ''}
      />
      {showUserDropdown && userSearch && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow max-h-48 overflow-auto text-sm">
          {filteredUsers.map((user) => (
            <button
              key={user.ID}
              type="button"
              className="w-full text-left px-3 py-1.5 hover:bg-gray-100"
              onClick={() => {
                setValue('RESPONSIBLE_ID', user.ID);
                setUserSearch(getUserDisplayName(user));
                setShowUserDropdown(false);
              }}
            >
              {getUserDisplayName(user)}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error.message}</p>}
    </div>
  );
};
