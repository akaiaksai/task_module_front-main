import type { Paginated, Task, TaskDetails } from '@/shared/types/task';
import { QueryClient } from '@tanstack/react-query';

/** Ключ списка задач (часть), чтобы одинаково находить все варианты */
export function tasksListKeyPart() {
  return ['tasks'] as const;
}

/** Обновить/добавить задачу в детальном кэше */
export function setTaskDetailsCache(qc: QueryClient, task: TaskDetails | Task) {
  qc.setQueryData(['task', task.id], (prev: ANY) => ({
    ...(prev ?? {}),
    ...task,
  }));
}

/** Пройтись по всем кэшам списков и обновить задачу в items[] */
export function upsertTaskInLists(
  qc: QueryClient,
  task: Partial<Task> & { id: string }
) {
  const keyPart = tasksListKeyPart();
  const queries = qc.getQueriesData<Paginated<Task>>({ queryKey: keyPart });

  queries.forEach(([key, data]) => {
    if (!data) {
      return;
    }
    const nextItems = data.items.map((i) =>
      i.id === task.id ? { ...i, ...task } : i
    );
    // если задачи не было в текущей странице — просто не трогаем
    qc.setQueryData(key, { ...data, items: nextItems });
  });
}

/** Инвалидировать все списки и деталь задачи (для принудительного рефетча) */
export function invalidateTaskEverywhere(qc: QueryClient, id?: string) {
  qc.invalidateQueries({ queryKey: tasksListKeyPart() });
  if (id) {
    qc.invalidateQueries({ queryKey: ['task', id] });
  }
}
