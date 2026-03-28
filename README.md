# Tasks Frontend

## Быстрый старт

```bash
pnpm i        # или npm i / yarn
cp .env.example .env
pnpm dev      # http://localhost:5173
```

## **.env.example**

```env
# API
VITE_API_BASE=

VITE_API_PREFIX=tasks-module-

#BASE
VITE_FRONTEND_URL="http://localhost:5173"
```

# Инструкция по работе с проектом

## Необходимые расширения для работы с проектом

При открытии vscode всплывает меню с рекомендованными расширениями для работы с этим проектом. Их нужно скачать, как минимум eslint и prettier чтобы привести весь код к одному стилю и избежать ошибок при работе
В проект был накатан husky, с помощью него у вас не получится запушить коммит если в нем есть хотя бы одна ошибка или проект вообще не билдится

## Настройка окружения

1. Убедитесь что установлен Node.js 18+
2. Установите зависимости: `npm ci`

## Что включено

- Vite + React + TS
- TailwindCSS
- TanStack Query (+ Devtools)
- Zustand (auth store)
- Axios client с интерсепторами (Bearer + 401 logout)
- ErrorBoundary + Sonner тосты
- Базовый роутинг и приватные маршруты
- Плейсхолдеры экранов для следующих эпиков

## Доступные скрипты

- `dev` - запуск dev-сервера
- `build` - сборка для production

## Разработка

- Используйте `npm run dev` для запуска dev-сервера
- Коммиты должны соответствовать Conventional Commits
- В TasksPageMobile в MobileCalendar передайте пропс isAdmin: isAdmin, чтобы вы могли видеть все задачи. При условии, что и в битриксе вы админ

# Работа с API

## Http-интерцептор

В проекте используется единый HTTP-клиент `http` (обёртка над Axios), который берёт на себя базовую инфраструктуру:

- автоматическое добавление **Bearer-токена** в каждый запрос
- обработку **401 Unauthorized** (форс-логаут пользователя)
- возврат только **data**, чтобы не разбирать Axios-ответ вручную
- единообразие ошибок

Это позволяет писать простые и короткие API-функции.

---

# Создание новых API-запросов

Для каждого функционального модуля существует собственная директория в `lib/api/...`, где размещаются запросы.

Пример комментариев\*:

```ts
import {
  CommentsResponse,
  CreateCommentData,
  CreateCommentResponse,
  UpdateCommentData,
} from '../../../types/comment';
import { http } from '../../http';

// Получение всех комментариев
export const fetchComments = async (
  taskId: string
): Promise<CommentsResponse> => {
  const { data } = await http.get<CommentsResponse>(
    `/tasks/${taskId}/comments`
  );
  return data;
};

// Создание комментария
export const createComment = async (
  taskId: string,
  commentData: CreateCommentData
): Promise<CreateCommentResponse> => {
  const { data } = await http.post<CreateCommentResponse>(
    `/tasks/${taskId}/comments`,
    commentData
  );
  return data;
};

// Обновление комментария
export const updateComment = async (
  taskId: string,
  commentId: number,
  commentData: UpdateCommentData
): Promise<void> => {
  await http.put(`/tasks/${taskId}/comments/${commentId}`, commentData);
};

// Удаление комментария
export const deleteComment = async (
  taskId: string,
  commentId: number
): Promise<void> => {
  await http.delete(`/tasks/${taskId}/comments/${commentId}`);
};
```

# 2. React Query — базовые хуки

Для получения комментариев:

```ts
import { useQuery } from '@tanstack/react-query';
import { fetchComments } from '../../../lib/api/tasks/comments';

export function useComments(taskId: string) {
  return useQuery({
    queryKey: ['comments', taskId],
    queryFn: () => fetchComments(taskId),
  });
}
```

# 3. React Query — единый хук действий с комментариями

Файл: src/hooks/useCommentActions.ts

````ts


export function useCommentActions(taskId: string) {
  const queryClient = useQueryClient();

  // CREATE
  const createMutation = useMutation<
    CreateCommentResponse,
    Error,
    CreateCommentData
  >({
    mutationFn: (commentData) => createComment(taskId, commentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });

  // UPDATE
  const updateMutation = useMutation<
    void,
    Error,
    { commentId: number; commentData: UpdateCommentData }
  >({
    mutationFn: ({ commentId, commentData }) =>
      updateComment(taskId, commentId, commentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });

  // DELETE
  const deleteMutation = useMutation<void, Error, number>({
    mutationFn: (commentId) => deleteComment(taskId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });

  return {
    createComment: createMutation.mutateAsync,
    updateComment: updateMutation.mutateAsync,
    deleteComment: deleteMutation.mutateAsync,

    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}

# Итоговая схема
bash```
http (axios + интерцептор)
        ↓
api/tasks/comments.ts     — чистые API функции
        ↓
hooks/useCommentActions   — React Query логика
        ↓
Компоненты UI             — только вызовы хуков
````

# Описание функциональности

## Страница задач

### Основные виды отображения задач

---

### **1. Список задач**

- Табличное представление с колонками: **Название**, **Статус**, **Приоритет**, **Исполнитель**, **Срок**
- Быстрое редактирование в строке таблицы
- Группировка по проектам/статусам

---

### **2. Канбан-доска**

- Drag & Drop перемещение между колонками статусов
- Визуальные карточки задач с основной информацией
- Быстрое изменение исполнителя и приоритета
- Цветовые индикаторы по сроку выполнения

---

### **3. Календарь**

#### Режим месяца:

- Отображение всех задач на месячном календаре
- Цветовое кодирование по приоритету/статусу
- Быстрый просмотр задач по дням

#### Режим недели:

- Детальное расписание на 7 дней
- Временные интервалы для задач с дедлайнами
- Drag & Drop для изменения сроков

#### Режим дня:

- Почасовое расписание
- Подробная информация о задачах на день
- Возможность планирования времени

---

## Функции работы с задачами

### **CRUD операции**

- **Создание:** модальное окно с формой
- **Просмотр:** детальная страница задачи
- **Редактирование:** через форму
- **Удаление:** подтверждение удаления, возможен архив

### **Комментарии**

- Система комментариев к каждой задаче

### **CRUD операции**

- **Создание:** модальное окно с формой
- **Редактирование:** через форму
- **Удаление:** подтверждение удаления, возможен архив

### **Время**

- Система учета времени к каждой задаче

### **CRUD операции**

- **Создание:** модальное окно с формой
- **Просмотр:** отдельная окошко с сущетсвующим времени к задаче
- **Редактирование:** через форму
- **Удаление:** подтверждение удаления, возможен архив

---

## Групповое представление

### **Отображение по участникам**

- У каждого участника свой календарь
- Drag & Drop перемещение задач между пользователями
- Цветовое кодирование по загруженности

### **Функции Drag & Drop**

- Изменение сроков (Календарь)
- Назначение исполнителей (Групповый view)

---

## Страница проектов

### **Карточка проекта**

- Прогресс-бар выполнения проекта

### **Фильтры проектов**

- Поиск по названию
- По Типу

---

## Система фильтров (на всех страницах)

### **Общие фильтры задач:**

- Поиск по названию

- По статусу: **Новые**, **В работе**, **На проверке**, **Выполнены**

- По исполнителю: Я исполнитель Я наблюдатель Я соисполнитель Я постановщик
