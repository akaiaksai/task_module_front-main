import { useIntermediateTask } from '@/hooks/tasks/useIntermediateTask';
import { useIntermediateLockStore } from '@/store/task-intermediate';
import { useState } from 'react';

export function IntermediateResultModal() {
  const [text, setText] = useState('');
  const { activeTaskId, finish } = useIntermediateLockStore();
  const { addIntermediateComment } = useIntermediateTask();

  const submit = async () => {
    if (!text.trim() || !activeTaskId) {
      return;
    }

    await addIntermediateComment(activeTaskId, text);
    finish();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      style={{ zIndex: 1000 }}
    >
      <div className="bg-white rounded-lg p-6 w-[400px]">
        <h3 className="text-lg font-medium mb-2">Чем занимался?</h3>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border rounded p-2 h-24"
        />

        <button
          onClick={submit}
          disabled={!text.trim()}
          className="mt-4 w-full bg-black text-white py-2 rounded"
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}
