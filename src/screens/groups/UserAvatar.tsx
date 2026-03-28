import { useState } from 'react';
import { getDisplayName } from '../../hooks/groups/useGroupsAndMembers';
import type { User } from '@/lib/api/users';

type AvatarSize = 'xss' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export function UserAvatar({
  user,
  size = 'md',
}: {
  user: User;
  size?: AvatarSize;
}) {
  const userName = getDisplayName(user) || '';
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const [imgError, setImgError] = useState(false);

  const sizeMap: Record<AvatarSize, string> = {
    xss: 'w-3 h-3 text-[7px]',
    xs: 'w-[14.67px] h-[14.67px] text-[7px]',
    sm: 'w-6 h-6 text-[9px]',
    md: 'w-7 h-7 text-[10px]',
    lg: 'w-8 h-8 text-[11px]',
    xl: 'w-[50px] h-[50px] text-[16px]',
  };

  const hasPhoto = Boolean(user?.photo) && !imgError;

  return (
    <div
      className={`
        ${sizeMap[size]}
        rounded-full
        overflow-hidden
        flex items-center justify-center
        bg-gradient-to-br from-gray-100 to-gray-200
        text-gray-600
        font-normal
      `}
    >
      {hasPhoto ? (
        <img
          src={user.photo as string}
          alt={userName || 'User avatar'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <span>{initials || 'U'}</span>
      )}
    </div>
  );
}
