import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { ChevronDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useMatch, useNavigate } from 'react-router-dom';
import { useClickOutside } from '../../../../hooks/ui/useClickOutside';
import { useUsers, useUserUtils } from '../../../../hooks/users/useUserActions';
import { WorkTimeCard } from '../../../../components/smart/workTimeCard';
import { WorkTimeTaskCardMobile } from '@/components/base/mobile/WorkTimeTaskCardMobile';
import { useActiveTimerTask } from '@/hooks/tasks/useActiveTimerTask';
import { CalendarSide } from '@/components/icons/calendarSide';
import { SideMenuLink } from './SideMenuLink';
import { Groups } from '@/components/icons/groups';
import { FileIcon } from '@/components/icons/file';
import { SettingsIconMobile } from '@/components/icons/settingsIconMobile';
import { GameChangerLogo } from '@/components/icons/gamechangerLogo';
import { ExitIcon } from '@/components/icons/exit';
import { useGroups } from '@/hooks/groups/useGroup';
import { UserAvatar } from '@/screens/groups/UserAvatar';

export const SideMenu: React.FC = () => {
  const { isMenuOpen, closeMenu } = useUIStore();
  const { logout, userId } = useAuthStore();
  const menuRef = useClickOutside(closeMenu);
  const timer = useActiveTimerTask();
  const { groups = [] } = useGroups();
  const [groupsOpen, setGroupsOpen] = useState(false);

  const navigate = useNavigate();

  const homeMatch = useMatch({ path: '/', end: true });
  const groupMatch = useMatch('/groups/:projectId');
  const activeGroupId = groupMatch?.params?.projectId
    ? Number(groupMatch.params.projectId)
    : null;
  const projectsMatch = useMatch('/projects/');
  const SettingsMatch = useMatch('/settings/');

  // Получаем данные пользователя по ID
  const { data: user } = useUsers.useById(userId || 0);

  // Получаем данные пользователя
  const displayName = useUserUtils.getDisplayName(user);
  const position = user?.WorkPosition?.String || 'Пользователь'; // Исправил опечатку

  useEffect(() => {
    if (activeGroupId) {
      setGroupsOpen(true);
    }
  }, [activeGroupId]);

  const isGroupsActive = !!activeGroupId;

  useEffect(() => {
    if (isMenuOpen) {
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  return (
    <>
      <div
        ref={menuRef}
        className={`fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out font-roboto ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 pt-[70px] pb-[30px]">
            <GameChangerLogo />
          </div>
          <div className="px-5">
            <div className="flex items-center gap-[5px]">
              <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center">
                {user ? (
                  <UserAvatar user={user} size="xl" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse" />
                )}
              </div>
              <div className="gap-y-[3px]">
                <div className="font-medium leading-[130%] tracking-[-0.5px] text-[18px]">
                  {displayName}
                </div>
                <div className="text-[14px] font-normal leading-[130%] tracking-[-0.5px] text-[#6E6E6E]">
                  {position}
                </div>
              </div>
            </div>
          </div>
          <div className="p-5 mt-5">
            {timer.hasTask && (
              <WorkTimeTaskCardMobile
                title={timer.title}
                planned={timer.plannedMinutes}
                spent={timer.spentMinutes}
                isRunning={timer.isRunning!}
                isCompleted={timer.isCompleted}
                isRenewing={timer.isRenewing}
                onToggle={timer.toggleTask}
                onFinish={timer.finishTask}
                onRenew={timer.renew}
              />
            )}
            <WorkTimeCard userId={userId!} />

            <div className="mt-[20px]">
              <SideMenuLink
                to="/"
                isActive={!!homeMatch}
                onClick={closeMenu}
                icon={CalendarSide}
              >
                Мои задачи
              </SideMenuLink>

              <button
                onClick={() => setGroupsOpen((v) => !v)}
                className={`
                  flex items-center gap-3 w-full py-[10px] px-[15px]
                  ${
                    isGroupsActive
                      ? 'bg-mobile-header text-white rounded-[10px] shadow-soft'
                      : ' text-gray-900'
                  }
                `}
              >
                <div
                  className={`
          w-[30px] h-[30px] flex items-center justify-center
          ${isGroupsActive ? '' : 'bg-[#E3E3E3] rounded-full'}
        `}
                >
                  <Groups
                    className={`
            ${isGroupsActive ? 'text-white' : 'text-black'}
          `}
                  />
                </div>
                <span className="flex-1 text-left text-[18px]">Группы</span>
                <span
                  className={`transition-transform ${groupsOpen ? 'rotate-180' : ''}`}
                >
                  <ChevronDown />
                </span>
              </button>

              {groupsOpen && (
                <div className="mt-1 flex flex-col gap-1 ml-[10px]">
                  {groups.map((group) => {
                    const isActive = group.ID === activeGroupId;

                    return (
                      <button
                        key={group.ID}
                        onClick={() => {
                          closeMenu();
                          setGroupsOpen(false);
                          navigate(`/groups/${group.ID}`);
                        }}
                        className={`
                            text-left
                            py-[6px]
                            px-2
                            rounded
                            text-[16px]
                            transition-colors
                            ${
                              isActive
                                ? 'bg-mobile-header text-white'
                                : 'text-[#4A4A4A] hover:bg-gray-100'
                            }
                          `}
                      >
                        {group.Name}
                      </button>
                    );
                  })}
                </div>
              )}

              <SideMenuLink
                to="/projects"
                isActive={!!projectsMatch}
                onClick={closeMenu}
                icon={FileIcon}
              >
                Проекты
              </SideMenuLink>
            </div>

            <div className="mt-[15px]">
              <SideMenuLink
                to="/settings"
                isActive={!!SettingsMatch}
                onClick={closeMenu}
                icon={SettingsIconMobile}
              >
                Настройки
              </SideMenuLink>

              <button
                onClick={handleLogout}
                className="
                mt-[3px]
                flex gap-3
                w-full
                py-[10px]
                px-4
                transition-colors
                hover:bg-red-50
                  "
              >
                <ExitIcon width={30} height={30} fill="#FC291A" />
                <span className="flex justify-center items-center font-normal text-[18px] leading-[130%] tracking-[-0.5px]">
                  Выйти
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
