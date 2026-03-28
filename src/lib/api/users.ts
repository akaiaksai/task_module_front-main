import { http } from '../http';

export interface User {
  ID: number;
  Name: {
    String: string;
  };
  LastName: {
    String: string;
  };
  Active: string;
  DateRegister: string;
  DepartmentID: number;
  Email: { String: string; Valid: boolean };
  IsBlocked: string;
  LanguageID: { String: string; Valid: boolean };
  LastActivityDate: string;
  LastLogin: string;
  photo: string;
  PersonalPhoto: { Int64: number; Valid: boolean };
  SecondName: { String: string; Valid: boolean };
  WorkPosition: { String: string; Valid: boolean };
}

export const fetchUsers = async (
  search: string
): Promise<{ result: User[] }> => {
  const params = search ? { search } : {};

  const { data } = await http.get<{ result: User[] }>('/users', {
    params,
  });

  return data;
};

export async function getUser(id: number) {
  const { data } = await http.get(`/users/${encodeURIComponent(id)}`);

  return data;
}
