import { useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { useClickOutside } from '../../hooks/ui/useClickOutside';

export default function UserDropdown({
  fullName,
  handleLogout,
}: {
  fullName: string;
  handleLogout: () => void;
}) {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const ref = useClickOutside(() => setIsUserDropdownOpen(false));

  return (
    <div className="relative">
      <button
        className="flex items-center gap-[clamp(0.2rem,0.3rem+0.3vw,0.6rem)] bg-gray-100 hover:bg-gray-200 px-[clamp(0.4rem,0.4rem+0.4vw,0.9rem)] py-[clamp(0.2rem,0.2rem+0.3vw,0.5rem)] rounded-md transition-colors"
        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
      >
        <div
          className="w-[clamp(1.3rem,1rem+1vw,1.9rem)] h-[clamp(1.3rem,1rem+1vw,1.9rem)]
                  bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center"
        >
          <User className="text-white w-[clamp(0.75rem,0.6rem+0.3vw,0.95rem)] h-[clamp(0.75rem,0.6rem+0.3vw,0.95rem)]" />
        </div>
        <span className="hidden sm:block text-[clamp(0.75rem,0.7rem+0.3vw,0.95rem)] text-gray-700 max-w-[7rem] truncate [@media(max-width:340px)]:hidden">
          {fullName || 'Пользователь'}
        </span>
      </button>

      {isUserDropdownOpen && (
        <div
          ref={ref} // <-- вот сюда подключаем ref
          className="absolute right-0 top-full mt-2 min-w-[12rem] bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
        >
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="font-medium text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
              {fullName}
            </div>
            <div className="text-sm text-gray-500">Ваш профиль</div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Выйти</span>
          </button>
        </div>
      )}
    </div>
  );
}
