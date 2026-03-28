// utils/dataNormalizers.ts
export const getStringValue = (value: ANY): string => {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object' && value.Valid) {
    return value.String || '';
  }
  return '';
};

export const getNumberValue = (value: ANY): number | null => {
  if (!value) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'object' && value.Valid !== undefined) {
    if (!value.Valid) {
      return null;
    }
    const numericKeys = Object.keys(value).filter(
      (key) =>
        key !== 'Valid' && key !== 'String' && typeof value[key] === 'number'
    );
    if (numericKeys.length > 0) {
      return value[numericKeys[0]];
    }
  }
  if (typeof value === 'string') {
    const num = parseInt(value);
    return isNaN(num) ? null : num;
  }
  return null;
};

export const normalizeIdArray = (array: ANY): number[] => {
  if (!array || array === null) {
    return [];
  }
  if (Array.isArray(array)) {
    return array
      .map((id: ANY) => {
        if (typeof id === 'object' && id !== null) {
          if (id.ID !== undefined) {
            return getNumberValue(id.ID);
          }
          if (id.id !== undefined) {
            return getNumberValue(id.id);
          }
        }
        return getNumberValue(id);
      })
      .filter((id): id is number => id !== null && id > 0);
  }
  return [];
};

export const normalizeTags = (tags: ANY): string[] => {
  if (!tags || tags === null) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags
      .map((item: ANY) => {
        if (typeof item === 'string') {
          return item;
        }
        if (typeof item === 'object' && item !== null) {
          return getStringValue(item);
        }
        return String(item);
      })
      .filter((item): item is string => item !== '' && item != null);
  }

  const tagsString = getStringValue(tags);
  if (!tagsString) {
    return [];
  }

  return tagsString
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag !== '');
};

export const normalizeStringArray = (array: ANY): string[] => {
  if (!array || array === null) {
    return [];
  }
  if (Array.isArray(array)) {
    return array
      .map((item: ANY) => {
        if (typeof item === 'string') {
          return item;
        }
        if (typeof item === 'object' && item !== null) {
          return getStringValue(item);
        }
        return String(item);
      })
      .filter((item): item is string => item !== '' && item != null);
  }
  return [];
};

export const secondsToHoursAndMinutes = (
  seconds: number | undefined
): { hours: number; minutes: number } => {
  if (!seconds) {
    return { hours: 0, minutes: 0 };
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return { hours, minutes };
};

export const hoursAndMinutesToSeconds = (
  hours: number | undefined,
  minutes: number | undefined
): number => {
  // Безопасно преобразуем undefined в 0
  const hoursValue = hours ?? 0;
  const minutesValue = minutes ?? 0;
  return hoursValue * 3600 + minutesValue * 60;
};
