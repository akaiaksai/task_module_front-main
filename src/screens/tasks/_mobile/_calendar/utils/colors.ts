const DEFAULT_GROUP_COLOR = {
  bg: '#000000',
  text: '#fff',
  border: '#fff',
};

export const GROUP_COLORS = [
  { bg: 'rgba(229, 248, 255, 0.5)', text: '#333333', border: '#333333' },
  { bg: '#E6FFFB', text: '#192A33', border: '#192A33' },
  { bg: '#F9EFFD', text: '#634A84', border: '#634A84' },
  { bg: '#FEF7E5', text: '#5A2E2E', border: '#5A2E2E' },
  { bg: '#E5F8FF', text: '#005337', border: '#005337' },
  { bg: '#FFF2E9', text: '#036570', border: '#036570' },
  { bg: '#F6EFE7', text: '#3D3598', border: '#3D3598' },
  { bg: '#FEFEE4', text: '#8AC200', border: '#8AC200' },
];

const DEPARTMENT_COLORS: Record<number, (typeof GROUP_COLORS)[0]> = {
  4: GROUP_COLORS[7],
  6: GROUP_COLORS[1],
  9: GROUP_COLORS[6],
  1: GROUP_COLORS[4],
  2: GROUP_COLORS[3],
  3: GROUP_COLORS[2],
  5: GROUP_COLORS[0],
  21: GROUP_COLORS[5],
};
const groupColorCache = new Map<number, (typeof GROUP_COLORS)[0]>();
// Кэш для цветов участников

export const getGroupColor = (groupId?: number | null) => {
  if (!groupId) {
    return DEFAULT_GROUP_COLOR;
  }

  if (DEPARTMENT_COLORS[groupId]) {
    return DEPARTMENT_COLORS[groupId];
  }

  if (groupColorCache.has(groupId)) {
    return groupColorCache.get(groupId)!;
  }

  let hash = 0;
  const groupIdStr = groupId.toString();
  for (let i = 0; i < groupIdStr.length; i++) {
    hash = groupIdStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GROUP_COLORS.length;
  const color = GROUP_COLORS[index];
  groupColorCache.set(groupId, color);
  return color;
};

export const getTaskTypeColor = (type: string) => {
  switch (type) {
    case 'urgent':
      return '#EF4642';
    case 'important':
      return '#E15A11';
    case 'regular':
      return '#E5B702';
    default:
      return '#2B2B2B';
  }
};

export const getTextColor = (bg: string): string => {
  const hex = bg.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
};
