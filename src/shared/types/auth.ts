export type LoginRequest = {
  fullName: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user_id?: number; // ← опционально, если бэк вернёт
};

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  status: string;
}
