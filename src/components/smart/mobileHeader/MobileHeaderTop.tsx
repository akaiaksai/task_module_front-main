import gamechangerLogo from '@logos/gamechanger.svg';
import { Menu, User } from 'lucide-react';

interface MobileHeaderTopProps {
  /** Callback при открытии меню */
  onMenuToggle: () => void;
}

/**
 * Верхняя часть мобильного хедера
 * Содержит кнопку меню, логотип и аватар пользователя
 */
export function MobileHeaderTop({ onMenuToggle }: MobileHeaderTopProps) {
  return (
    <div className="container flex items-center justify-between h-16 px-4">
      {/* Кнопка меню */}
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Открыть меню"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Логотип */}
      <div className="flex-1 flex justify-center">
        <img
          src={gamechangerLogo}
          alt="Gamechanger Logo"
          className="h-4 w-auto"
        />
      </div>

      {/* Аватар пользователя */}
      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
        <User className="w-5 h-5 text-gray-600" />
      </div>
    </div>
  );
}
