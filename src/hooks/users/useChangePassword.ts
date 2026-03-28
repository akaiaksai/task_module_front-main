import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { changePassword } from '../../lib/api/auth';
import { ChangePasswordRequest } from '../../shared/types/auth';

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changePassword(data),
    onSuccess: () => {
      toast.success('Пароль успешно изменен');
    },
    onError: (error: ANY) => {
      if (error.response?.status === 401) {
        toast.error('Неверный текущий пароль');
      } else if (error.response?.status === 400) {
        toast.error('Ошибка валидации данных');
      } else {
        toast.error('Ошибка при изменении пароля');
      }
    },
  });
}
