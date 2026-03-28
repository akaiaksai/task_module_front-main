import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { FooterMenuIcon } from '@/components/icons/footerMenu';
import { useUIStore } from '@/store/ui';

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [groupsOpen, setGroupsOpen] = useState(false);
  const { isMenuOpen, openMenu, closeMenu } = useUIStore();

  const handleMenuClick = () => {
    if (isMenuOpen) {
      closeMenu();
    } else {
      closeMenu();
      openMenu();
    }
  };

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-mobile-header backdrop-blur-xl ui-glow px-6 pt-[15px] pb-[17px]">
      <div className="flex items-center justify-between text-white text-[12px] font-normal leading-[100%]">
        <BottomNavItem
          label="Мои"
          active={isActive('/')}
          onClick={() => navigate('/')}
        />

        <div className="relative">
          <button
            onClick={() => setGroupsOpen((v) => !v)}
            className="flex items-center gap-1 opacity-90"
          >
            <span className="relative inline-block">
              Группы {isActive('/groups') && <Dot />}
            </span>
            <ChevronUp
              size={16}
              className={clsx(
                'transition-transform',
                groupsOpen ? 'rotate-0' : 'rotate-180'
              )}
            />
          </button>

          {groupsOpen && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-mobile-header ui-glow backdrop-blur-xl rounded-[14px] px-4 py-3 text-sm space-y-2 border border-white/10">
              <GroupItem
                to="/groups/6"
                onClick={() => setGroupsOpen(false)}
                label="Встречи"
                active={location.pathname === '/groups/6'}
              />
              <GroupItem
                to="/groups/3"
                onClick={() => setGroupsOpen(false)}
                label="Дизайн"
                active={location.pathname === '/groups/3'}
              />
              <GroupItem
                to="/groups/2"
                onClick={() => setGroupsOpen(false)}
                label="Интеграторы"
                active={location.pathname === '/groups/2'}
              />
              <GroupItem
                to="/groups/1"
                onClick={() => setGroupsOpen(false)}
                label="Программисты"
                active={location.pathname === '/groups/1'}
              />
            </div>
          )}
        </div>

        <BottomNavItem
          label="Проект"
          active={isActive('/projects')}
          onClick={() => navigate('/projects')}
        />

        <BottomNavItem
          label="Эйзенхауер"
          active={location.search.includes('view=eisenhower')}
          onClick={() => navigate('/?view=eisenhower')}
        />

        <button
          onClick={handleMenuClick}
          className="opacity-80 hover:opacity-100 transition"
        >
          <FooterMenuIcon />
        </button>
      </div>
    </div>
  );
}

function BottomNavItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative opacity-80 hover:opacity-100 transition',
        active && 'opacity-100'
      )}
    >
      {label}
      {active && <Dot />}
    </button>
  );
}

function Dot() {
  return (
    <span className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-[6px] h-[6px] bg-white rounded-full" />
  );
}

function GroupItem({
  to,
  label,
  active,
  onClick,
}: {
  to: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={clsx(
        'block whitespace-nowrap transition',
        active ? 'text-white opacity-100' : 'opacity-70'
      )}
    >
      {label}
    </Link>
  );
}
