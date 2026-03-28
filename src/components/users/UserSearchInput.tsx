import { useState } from 'react';
import { useClickOutside } from '../../hooks/ui/useClickOutside';
import { useDebounced } from '../../hooks/ui/useDebounced';
import { useUsers } from '../../hooks/users/useUserActions';
import Input from '../../ui/Input';

export function UserSearchInput({
  placeholder,
  disabled = false,
  onClear,
  onChange,
}: {
  placeholder: string;
  value: string;
  disabled?: boolean;
  onClear?: () => void;
  onChange: (value: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedSearch = useDebounced(search, 400);

  const { data: usersData, isLoading: usersLoading } =
    useUsers.useSearch(debouncedSearch);
  const users = usersData?.result || [];

  const dropdownRef = useClickOutside(() => setShowDropdown(false));

  const handleSelectUser = (user: ANY) => {
    onChange(user.ID.toString());
    setSearch(
      `${user.Name?.String || ''} ${user.LastName?.String || ''}`.trim()
    );
    setShowDropdown(false);
  };

  const clearSelection = () => {
    onChange('');
    setSearch('');
    onClear?.(); // Добавляем вызов onClear при очистке
  };

  const getUserDisplayName = (user: ANY) => {
    const name = user.Name?.String || '';
    const lastName = user.LastName?.String || '';
    return [name, lastName].filter(Boolean).join(' ') || `ID: ${user.ID}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            if (disabled) {
              return;
            }
            setSearch(e.target.value);
            setShowDropdown(true);
            if (!e.target.value) {
              onChange('');
              onClear?.(); // Также вызываем onClear при ручной очистке через Backspace
            }
          }}
          onFocus={() => !disabled && setShowDropdown(true)}
          disabled={disabled}
          className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
        />
        {search && !disabled && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={disabled}
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && search && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {usersLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Загрузка...</div>
          ) : (
            users.map((user) => (
              <button
                key={user.ID}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleSelectUser(user)}
                disabled={disabled}
              >
                {getUserDisplayName(user)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
