import { http } from '@/lib/http';
import { useEffect, useState } from 'react';

export function getMaybeString(v: ANY): string {
  if (!v) {
    return '';
  }
  if (typeof v === 'string') {
    return v;
  }
  const valid = v.Valid ?? v.valid;
  const str = v.String ?? v.string;
  if (typeof str === 'string' && (valid === true || valid === undefined)) {
    return str;
  }
  return '';
}

export function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

// ---- CRM Leads ----
export async function fetchCrmLeads(
  search: string
): Promise<{ result: ANY[] }> {
  const params = search ? { search } : {};
  const { data } = await http.get<{ result: ANY[] }>('/crm/leads/list', {
    params,
  });
  return data;
}

// ---- Users helpers ----
export function userDisplayName(u: ANY): string {
  const first = getMaybeString(u?.name ?? u?.Name);
  const last = getMaybeString(u?.lastName ?? u?.LastName);
  const full = [last, first].filter(Boolean).join(' ').trim();
  return full || first || last || `User#${u?.id ?? u?.ID ?? '??'}`;
}

export function userIdValue(u: ANY): number | null {
  const id = u?.id ?? u?.ID;
  return typeof id === 'number' ? id : null;
}
