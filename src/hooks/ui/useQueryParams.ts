// src/hooks/useQueryParams.ts
import { useSearchParams } from 'react-router-dom';

export function useQueryParams<T extends Record<string, ANY>>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Получаем текущие параметры, используя значения по умолчанию
  const params = { ...defaults };
  for (const [key, value] of searchParams.entries()) {
    (params as ANY)[key] = value;
  }

  // Функция для обновления параметров
  const setParams = (updates: Partial<T>) => {
    const newSearchParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, String(value));
      }
    });

    setSearchParams(newSearchParams, { replace: true });
  };

  return {
    params: params as T,
    setParams,
  };
}

export default useQueryParams;
