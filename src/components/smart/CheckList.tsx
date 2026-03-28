// screens/tasks/TaskView.tsx
import { toggleChecklistItem } from '@/lib/api/tasks/tasks';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ChecklistTab {
  id: number;
  label: string;
}

interface ChecklistItem {
  id: number;
  text: string;
  checked: boolean;
  disabled?: boolean;
}

interface CheckListProps {
  title: string;
  tabs: ChecklistTab[];
  items: ChecklistItem[];
  activeTab: number | null;
  onTabChange: (id: number) => void;
  taskId: string;
  isDesktop?: boolean;
}

export function CheckList({
  title,
  tabs,
  items,
  activeTab,
  onTabChange,
  taskId,
  isDesktop,
}: CheckListProps) {
  const [localItems, setLocalItems] = useState<ChecklistItem[]>(items);

  // когда пришли новые items (другая задача / другой чеклист) — синхронизируемся
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const toggleItem = async (id: number) => {
    // находим текущий элемент по id
    const current = localItems.find((item) => item.id === id);

    // если по какой-то причине не нашли — выходим
    if (!current) {
      return;
    }

    // новое значение чекбокса (что мы хотим получить)
    const newChecked = !current.checked;

    // оптимистично обновляем UI
    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: newChecked } : item
      )
    );

    try {
      // отправляем новое состояние на бек
      await toggleChecklistItem(taskId, id, newChecked);
    } catch (error) {
      console.error('Ошибка при переключении чек-листа', error);

      // откатываем UI, если запрос упал
      setLocalItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, checked: !newChecked } : item
        )
      );
    }
  };

  const prevTab = () => {
    const index = tabs.findIndex((t) => t.id === activeTab);
    if (index > 0) {
      onTabChange(tabs[index - 1].id);
    }
  };

  const nextTab = () => {
    const index = tabs.findIndex((t) => t.id === activeTab);
    if (index < tabs.length - 1) {
      onTabChange(tabs[index + 1].id);
    }
  };

  if (!isDesktop) {
    return (
      <div className="font-roboto bg-white rounded-[11.53px] p-5 text-black shadow-xl mb-7">
        <h2 className="text-[18px] font-normal mb-5 leading-[130%]">{title}</h2>

        <div className="flex items-stretch justify-between mb-4">
          <button
            onClick={prevTab}
            className="self-stretch relative flex items-center after:content-[''] after:absolute after:w-[20px] after:h-full after:top-0 after:right-[-14px] after:bg-[linear-gradient(to_left,transparent,white)] after:z-[1]"
          >
            <ChevronLeft className="text-black" />
          </button>

          <div className="flex items-center overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-3 rounded-[14px] text-sm whitespace-nowrap border transition-all
                  border-[#00000052]
                ${
                  activeTab === tab.id
                    ? 'bg-black text-white'
                    : 'bg-transparent  text-[#999]'
                }`}
              >
                #{tab.id} {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={nextTab}
            className="self-stretch relative flex items-center after:content-[''] after:absolute after:w-[20px] after:h-full after:top-0 after:left-[-14px] after:bg-[linear-gradient(to_right,transparent,white)] after:z-[1]"
          >
            <ChevronRight className="text-black" />
          </button>
        </div>

        <div className="w-full h-[1px] bg-white mb-5" />

        <div className="space-y-3">
          {localItems.map((item) => (
            <div
              key={item.id}
              onClick={() => !item.disabled && toggleItem(item.id)}
              className={`
              rounded-xl px-4 py-4 border flex items-center gap-3 transition-all cursor-pointer border-[#00000052]
              ${item.checked && ' opacity-60'}
              ${item.disabled && 'opacity-30 cursor-not-allowed'}
            `}
            >
              <div className="w-4 h-4 flex items-center justify-center rounded-full border border-black transition-all shrink-0">
                {item.checked && (
                  <div className="w-2.5 h-2.5 rounded-full bg-black" />
                )}
              </div>

              <span className="text-[14px] leading-[130%] font-normal break-words overflow-hidden">
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="font-roboto bg-white rounded-3xl px-4 pt-2 pb-4  shadow-xl mb-7">
      <div className="flex items-center justify-between mb-5 gap-3">
        {/* LEFT TITLE */}
        <h2 className="text-[16.67px] font-normal whitespace-nowrap leading-[130%] tracking-[-0.58px]">
          {title}
        </h2>

        {/* CENTER — TABS */}
        <div className="flex items-center gap-[6.91px] overflow-x-auto hide-scrollbar flex-1">
          {/* <button
            onClick={prevTab}
            className="self-stretch flex items-center px-2"
          >
            <ChevronLeft className="text-black" />
          </button> */}
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`p-[8.33px] rounded-[9.72px] text-[9.72px] leading-[130%]  whitespace-nowrap border transition-all
              ${
                activeTab === tab.id
                  ? 'bg-black text-white border-white'
                  : 'opacity-60'
              }`}
            >
              #{tab.id} {tab.label}
            </button>
          ))}
        </div>
        {/* <button
          onClick={nextTab}
          className="self-stretch flex items-center px-2"
        >
          <ChevronRight className="text-black" />
        </button> */}
      </div>

      <div className="w-full h-[1px] bg-[#FFFFFF1F] mb-5" />

      {/* CHECKLIST ITEMS */}
      <div className="space-y-3">
        {localItems.map((item) => (
          <div
            key={item.id}
            onClick={() => !item.disabled && toggleItem(item.id)}
            className={`
            rounded-xl px-4 py-4 border flex items-center gap-3 transition-all cursor-pointer
            ${item.checked ? 'opacity-40' : ''}
            ${item.disabled ? 'opacity-30 cursor-not-allowed' : ''}
          `}
          >
            <div className="w-4 h-4 flex items-center justify-center rounded-full border border-black transition-all">
              {item.checked && (
                <div className="w-2.5 h-2.5 rounded-full bg-black" />
              )}
            </div>

            <span className="text-[14px] leading-[130%] font-normal">
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
