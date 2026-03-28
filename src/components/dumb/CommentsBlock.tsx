import { Avatar } from '@/components/dumb/Avatar';
import { addComment } from '@/lib/api/tasks/tasks';
import { CommentItem } from '@/shared/types/comment';
import { Task } from '@/shared/types/task';
import { formatBitrixDate } from '@/shared/utils/helpers';
import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { WindowCard } from './WindowCard';

type CommentsBlockProps = {
  task: Task;
  onClose: () => void;
};

export function CommentsBlock({ task, onClose }: CommentsBlockProps) {
  const [input, setInput] = useState('');
  const [comments, setComments] = useState<CommentItem[]>(task.comments || []);
  const reversedComments = [...comments].reverse();
  const scrollRef = useRef<HTMLDivElement>(null);

  async function handleAddComment() {
    if (!input.trim()) {
      return;
    }

    try {
      await addComment(task.id, input.trim());
      toast.success('Комментарий успешно добавлен');
    } catch (err) {
      console.error('Ошибка при добавлении комментария:', err);
      return;
    }

    setComments((prev: CommentItem[]) => {
      const now = new Date().toISOString();
      const formatted = formatBitrixDate(now);

      return [
        ...prev,
        {
          id: Date.now(),
          text: input.trim(),
          avatarColor: '#CCCCCC',
          AuthorName: 'Вы',
          PostDate: new Date().toISOString(),
          time: formatted.time,
          highlight: true,
          PostMessage: { String: input.trim(), Valid: true },
          title: '',
          status: 'done',
        },
      ];
    });

    setInput('');
  }

  return (
    <WindowCard
      titleClassName="text-white"
      title="Комментарии"
      onClose={onClose}
    >
      <div className="flex flex-col h-[520px] font-roboto">
        <div
          className="flex-1 overflow-y-auto space-y-5"
          ref={scrollRef}
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'auto',
            overflowX: 'hidden',
          }}
        >
          {reversedComments.map((c: CommentItem) => (
            <div key={c.id}>
              <div
                className={`rounded-xl border p-5 text-[14px] leading-[130%] font-normal text-[#2B2B2B] whitespace-pre-wrap ${
                  c.highlight
                    ? 'bg-[#EAF2FF] border-[#2879FE1F]'
                    : 'border-[#0000001F]'
                }`}
              >
                {c.PostMessage?.String || ''}

                <div className="flex items-center justify-between mt-7">
                  <div className="flex items-center gap-2">
                    <Avatar src={c.avatarUrl} name={c.AuthorName} />

                    <span className="text-[14px] leading-[130%] font-normal text-[#2B2B2B]">
                      {c.AuthorName}
                    </span>
                  </div>

                  <span className="text-[12px] text-[#2B2B2B73] leading-[130%] font-normal">
                    {formatBitrixDate(c.PostDate).date} /{' '}
                    {formatBitrixDate(c.PostDate).time}
                  </span>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-center text-[#2B2B2B52] text-[14px] leading-[130%] font-normal">
            Начало переписки
          </div>
        </div>

        {/* INPUT BAR */}
        <div className="pt-3">
          <div className="relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Введите сообщение"
              className="
                w-full border border-[#2B2B2B52] rounded-xl py-3 pl-3 pr-3
                outline-none text-[16px] font-normal 
                focus:ring-2 focus:ring-[#2D8CFF33] focus:border-[#2D8CFF]
              "
            />

            <button
              onClick={handleAddComment}
              className="
                absolute right-3 top-1/2 -translate-y-1/2
                 w-6 h-6 rounded-full
                flex items-center justify-center
                text-[#2B2B2B] hover:bg-[#d2d3d3] transition
              "
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </WindowCard>
  );
}
