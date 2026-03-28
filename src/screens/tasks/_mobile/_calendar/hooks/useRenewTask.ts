import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { http } from '@/lib/http';
import { taskKeys } from '@/hooks/tasks/useTaskActions';

export function useRenewTask() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (taskId: string | number) => {
      const res = await http.post(`/tasks/${taskId}/renew`);
      return res.data;
    },
    onSuccess: (_, taskId) => {
      toast.success('Задача возобновлена');
      queryClient.invalidateQueries({
        queryKey: taskKeys.detail(String(taskId)),
      });
      queryClient.invalidateQueries({ queryKey: ['task', String(taskId)] });
    },
    onError: () => {
      toast.error('Не удалось возобновить задачу');
    },
  });

  return {
    renewTask: (id: string | number) => mutation.mutate(id),
    isLoading: mutation.isPending,
  };
}
