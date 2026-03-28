import { getStringValue } from '@/shared/utils/helpers';
import { useState } from 'react';

interface DescriptionBlockProps {
  task: ANY;
  isDesktop?: boolean;
  onSave?: (data: { DESCRIPTION: string }) => void;
}

export const DescriptionBlock = ({
  task,
  isDesktop = false,
  onSave,
}: DescriptionBlockProps) => {
  const description = getStringValue(task.description);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description);

  function startEdit() {
    setDraft(description);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft(description);
  }

  function save() {
    setEditing(false);
    if (draft !== description) {
      onSave?.({ DESCRIPTION: String(draft) });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  }

  if (!isDesktop) {
    return (
      <div className="font-roboto mb-7">
        <h3 className="text-[18px] font-normal text-white mb-4 leading-[130%]">
          Описание
        </h3>

        <div
          className="bg-[#8AE6FF1F] rounded-2xl p-5 shadow-xl border border-[#8AE6FF80] cursor-pointer max-h-[400px] overflow-y-auto"
          onClick={() => !editing && startEdit()}
        >
          {!editing ? (
            <div className="visible-scroll text-[16px] leading-[130%] text-white whitespace-pre-wrap break-words overflow-y-auto pr-3">
              {description || (
                <span className="text-neutral-500 text-[16px]">
                  Описания нет
                </span>
              )}
            </div>
          ) : (
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              className="w-full min-h-[200px] px-3 py-2 border rounded-lg text-[16px] leading-[130%]"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="font-roboto mb-[35px]">
      {/* <h3 className="text-[22px] font-normal text-[#1A1A1A] mb-5 leading-[130%] tracking-[-0.58px]">
        Описание
      </h3> */}

      <div
        className="bg-[#8AE6FF1F] rounded-2xl p-6 shadow-xl border border-[#8AE6FF80] cursor-pointer max-h-[200px] overflow-y-auto"
        onDoubleClick={() => !editing && startEdit()}
      >
        {!editing ? (
          <div
            className="visible-scroll text-sm leading-[130%] text-white whitespace-pre-wrap break-words overflow-y-auto pr-3"
            style={{ maxHeight: '380px' }}
          >
            {description ? (
              <div className="prose prose-sm max-w-none">
                {task.descriptionInBbcode ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: description
                        .replace(
                          /\[URL=([^\]]+)\]([\s\S]*?)\[\/URL\]/gi,
                          (_, href, label) =>
                            `<a href="${href}" 
                                target="_blank" 
                                rel="noreferrer"
                                class="text-blue-600 hover:underline">${label}</a>`
                        )
                        .replace(/\u0026amp;/g, '&'),
                    }}
                  />
                ) : (
                  <div>{description}</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-neutral-500">Описания нет</div>
            )}
          </div>
        ) : (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border rounded-lg text-sm leading-[130%]"
          />
        )}
      </div>
    </div>
  );
};
