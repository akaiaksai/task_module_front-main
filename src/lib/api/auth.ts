import { http } from '@/lib/http';
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  LoginRequest,
  LoginResponse,
} from '@/shared/types/auth';

export async function login(payload: LoginRequest) {
  const body = { fullName: payload.fullName, password: payload.password };
  const { data } = await http.post<LoginResponse>('/auth/login', body);
  return data;
}

export async function changePassword(
  payload: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  const { data } = await http.post<ChangePasswordResponse>(
    '/auth/change-password',
    payload
  );
  return data;
}
