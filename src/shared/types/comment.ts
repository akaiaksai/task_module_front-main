export interface Comment {
  ID: number;
  PostDate: string;
  PostMessage: {
    String: string;
    Valid: boolean;
  };
  AuthorID: number;
  AuthorName: string;
}

export interface CommentItem {
  id: number;
  text: string; // текст комментария
  avatarColor: string; // цвет аватарки (можно заглушку)
  AuthorName: string; // имя автора
  PostDate: string; // "dd.MM.yyyy"
  time: string; // "HH:mm"
  highlight?: boolean; // подсветка нового
  PostMessage: {
    String: string;
    Valid: boolean;
  }; // сырой текст, если где-то нужен
  title: string; // если не используешь — можно "" ставить
  status: 'waiting' | 'done'; // если не используешь — можно "done"
  avatarUrl?: string; // URL аватарки, если есть
}

export interface CommentsResponse {
  result: Comment[];
}

export interface CreateCommentData {
  POST_MESSAGE: string;
}

export interface CreateCommentResponse {
  status: string;
  commentId: number;
}

export interface UpdateCommentData {
  POST_MESSAGE: string;
}
