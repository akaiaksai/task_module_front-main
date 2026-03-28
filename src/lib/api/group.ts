import { http } from '../http';

export interface Group {
  ID: number;
  Name: string;
  Description: string;
  DateCreate: string;
}

export const fetchGroups = async (
  search: string
): Promise<{ result: Group[] }> => {
  const params = search ? { search } : {};

  const { data } = await http.get<{ result: Group[] }>('/groups/list', {
    params,
  });

  return data;
};
