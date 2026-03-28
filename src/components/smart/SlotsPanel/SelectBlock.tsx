import { ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type SelectVariant = 'picker' | 'search';

export function SelectBlock({
  title,
  options,
  value,
  onChange,
  variant = 'search',
  placeholder = 'Начните вводить…',
  allowCustom = true,
  isLoading = false,
  className,
  searchQuery,
  onSearchQueryChange,
}: {
  title: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  variant?: SelectVariant;
  placeholder?: string;
  allowCustom?: boolean;
  isLoading?: boolean;
  className?: string;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
}) {
  const [open, setOpen] = useState(false);

  // если searchQuery не передали — ведём себя как автономный инпут
  const [innerQuery, setInnerQuery] = useState(value);
  const query = searchQuery ?? innerQuery;

  useEffect(() => {
    if (variant === 'search' && searchQuery === undefined) {
      setInnerQuery(value);
    }
  }, [value, variant, searchQuery]);

  const filtered = useMemo(() => {
    if (variant !== 'search') {
      return options;
    }

    const q = (query ?? '').trim().toLowerCase();
    if (!q) {
      return options;
    }
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, query, variant]);

  const commit = (next: string) => {
    onChange(next);

    if (variant === 'search') {
      if (onSearchQueryChange) {
        onSearchQueryChange(next);
      } else {
        setInnerQuery(next);
      }
    }

    setOpen(false);
  };

  const showUseCustom =
    variant === 'search' &&
    allowCustom &&
    (query ?? '').trim().length > 0 &&
    !options.some(
      (o) => o.toLowerCase() === (query ?? '').trim().toLowerCase()
    );

  return (
    <div className={className}>
      <p className="text-[12px] leading-[130%] tracking-[-0.5px] font-medium mb-[10px] pt-[9px] px-[13px]">
        {title}
      </p>

      <div className="rounded-[10px] border border-white/60 overflow-hidden">
        {variant === 'search' ? (
          <div className="w-full flex items-center justify-between px-3 mt-[8px] mb-[4px] gap-2">
            <input
              value={query ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                if (onSearchQueryChange) {
                  onSearchQueryChange(v);
                } else {
                  setInnerQuery(v);
                }

                if (!open) {
                  setOpen(true);
                }
              }}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              className="
                w-full bg-transparent outline-none
                text-[16px] leading-[130%] tracking-[-0.5px] font-medium
                placeholder:text-white/50
              "
            />

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="shrink-0 text-white/80"
              aria-label="Toggle"
            >
              <ChevronDown
                size={16}
                className={`transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
              />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="
              w-full flex items-center justify-between
              px-3 mt-[8px] mb-[4px]
              text-left text-[12px] leading-[130%] tracking-[-0.5px] font-medium
            "
          >
            <span className="text-white">{value}</span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${open ? 'rotate-180' : 'rotate-0'}`}
            />
          </button>
        )}

        {open && <div className="mx-3 h-px bg-white/60" />}

        <div
          className={`
            transition-all duration-300 ease-out
            ${open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
            overflow-hidden
          `}
        >
          {isLoading && (
            <div className="px-3 my-[10px] text-[12px] font-medium text-white/60">
              Загрузка…
            </div>
          )}

          {!isLoading && showUseCustom && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit((query ?? '').trim())}
              className="
                w-full text-left
                px-3 my-[10px]
                text-[12px] leading-[130%] tracking-[-0.5px] font-medium
                text-white/90 hover:bg-white/10 transition
              "
            >
              Использовать: {(query ?? '').trim()}
            </button>
          )}

          {!isLoading &&
            (filtered.length > 0 ? (
              filtered.map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(opt)}
                  className={`
                  w-full text-left px-3 my-[10px]
                  text-[12px] leading-[130%] tracking-[-0.5px] font-medium
                  hover:bg-white/10 transition
                  ${opt === value ? 'text-white' : 'text-white/80'}
                `}
                >
                  {opt}
                </button>
              ))
            ) : (
              <div className="px-3 my-[10px] text-[12px] font-medium text-white/60">
                Ничего не найдено
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
