import { FC, useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Member } from '@/shared/interfaces/Member';

interface MultiSelectProps {
  label: string;
  items: Member[];
  selected: Member[];
  onChange: React.Dispatch<React.SetStateAction<Member[]>>;
  multiple?: boolean;
  disabled?: boolean;
}

export const MultiSelectField: FC<MultiSelectProps> = ({
  label,
  items,
  selected,
  onChange,
  multiple = false,
}) => {
  const [open, setOpen] = useState(false);

  const toggle = (m: Member) => {
    if (multiple) {
      const exists = selected.some((s) => s.id === m.id);
      if (exists) {
        onChange(selected.filter((s) => s.id !== m.id));
      } else {
        onChange([...selected, m]);
      }
    } else {
      onChange([m]);
      setOpen(false);
    }
  };

  const removeSelected = (id: number) => {
    onChange(selected.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-2">
      <span className="text-[14px] font-medium leading-[130%] text-[#2B2B2B]">
        {label}
      </span>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="
            w-full border border-[#2B2B2B1F] rounded-xl px-4 py-3
            flex items-start justify-between
          "
        >
          <div className="flex flex-col gap-2 text-left">
            {selected.length === 0 ? (
              <span className="text-gray-400 text-sm">Выберите</span>
            ) : (
              selected.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 text-sm group"
                >
                  <div className="w-4 h-4 bg-gray-300 rounded-full" />
                  {s.name}

                  {multiple && (
                    <button
                      className="ml-2 text-gray-400 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSelected(s.id);
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <ChevronDown
            className={`w-5 h-5 text-gray-500 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        {open && (
          <div className="absolute mt-2 w-full bg-white shadow-xl rounded-xl border border-gray-200 z-20 max-h-64 overflow-auto">
            {items.map((m) => {
              const isSel = selected.some((s) => s.id === m.id);

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full" />
                  <span className="text-sm flex-1">{m.name}</span>

                  {isSel && <span className="text-blue-500 font-bold">•</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const MultiSelectSearch: FC<MultiSelectProps> = ({
  label,
  items,
  selected,
  onChange,
  multiple = false,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAndSortedItems = useMemo(() => {
    const filtered = searchTerm
      ? items.filter((item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : items;

    const selectedItems = filtered.filter((item) =>
      selected.some((s) => s.id === item.id)
    );

    const unselectedItems = filtered.filter(
      (item) => !selected.some((s) => s.id === item.id)
    );

    const sortedUnselected = unselectedItems.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return [...selectedItems, ...sortedUnselected];
  }, [items, searchTerm, selected]);

  const toggle = (m: Member) => {
    if (multiple) {
      const exists = selected.some((s) => s.id === m.id);
      if (exists) {
        setSearchTerm('');
        onChange(selected.filter((s) => s.id !== m.id));
      } else {
        setSearchTerm('');
        onChange([...selected, m]);
      }
    } else {
      onChange([m]);
      setOpen(false);
      setSearchTerm('');
    }
  };

  const removeSelected = (id: number) => {
    onChange(selected.filter((s) => s.id !== id));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="space-y-2">
      <span className="text-[14px] font-medium leading-[130%] text-[#2B2B2B]">
        {label}
      </span>

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className="
            w-full border border-[#2B2B2B1F] rounded-xl px-4 py-3
            flex items-start justify-between
            hover:border-gray-400 transition-colors
          "
        >
          <div className="flex flex-col gap-2 text-left flex-1">
            {selected.length === 0 ? (
              <span className="text-gray-400 text-sm">Выберите</span>
            ) : (
              selected.map((s) => (
                <div key={s.id} className="flex items-center gap-3 text-sm">
                  <div className="w-4 h-4 bg-gray-300 rounded-full" />
                  {s.name}
                </div>
              ))
            )}
          </div>

          <ChevronDown
            className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        {open && (
          <div className="absolute mt-2 w-full bg-white shadow-xl rounded-xl border border-gray-200 z-20 max-h-64 overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder="Поиск пользователей..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[16px]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="max-h-48 overflow-auto">
              {filteredAndSortedItems.map((m) => {
                const isSelected = selected.some((s) => s.id === m.id);

                return (
                  <div
                    key={m.id}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0
                      ${isSelected ? 'bg-blue-50' : ''}
                      cursor-pointer
                    `}
                    onClick={() => toggle(m)}
                  >
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0" />
                    <span className="text-sm flex-1">{m.name}</span>

                    {isSelected && multiple && (
                      <button
                        className="text-gray-400 hover:text-red-500 transition-colors ml-2 w-5 h-5 flex items-center justify-center rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelected(m.id);
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}

              {filteredAndSortedItems.length === 0 && (
                <div className="px-4 py-3 text-center text-gray-500 text-sm">
                  Пользователи не найдены
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
