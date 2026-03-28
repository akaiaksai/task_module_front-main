// src/utils/users.ts
export const getUserDisplayName = (user: ANY): string => {
  if (!user) {
    return 'Не назначен';
  }

  if (user.name && user.last_name) {
    return `${user.name} ${user.last_name}`.trim();
  }

  return (
    user.name || user.last_name || user.email || 'Неизвестный пользователь'
  );
};

export const getUserInitials = (user: ANY): string => {
  if (!user) {
    return 'Н';
  }

  const firstName = user.name?.[0] || '';
  const lastName = user.last_name?.[0] || '';

  return `${firstName}${lastName}`.toUpperCase() || 'Н';
};
