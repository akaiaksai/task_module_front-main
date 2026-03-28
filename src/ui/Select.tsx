import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

type Option = { label: string; value: string | number };

type SelectProps = {
  value: string | number;
  onChange: (value: string | number) => void;
  options?: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  isActive?: boolean; // ✅ новое свойство для внешней подсветки
};

function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Выберите...',
  disabled = false,
  isActive = false,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value == value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={clsx('relative inline-block', className)}>
      {/* Кнопка */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={clsx(
          `
            inline-flex items-center justify-between 
            rounded-xl border bg-white px-3 py-2 text-sm 
            transition-all whitespace-nowrap
            w-full min-w-[120px] max-w-[300px]
          `,
          disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'cursor-pointer hover:bg-gray-50',
          isActive
            ? 'border-blue-400 ring-2 ring-blue-200 bg-blue-50' // ✅ визуальная подсветка при активной странице
            : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400'
        )}
      >
        <span
          className={clsx(
            !selected && 'text-gray-400',
            'truncate flex-1 text-left mr-5'
          )}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={clsx(
            'h-4 w-4 transition-transform flex-shrink-0',
            open && 'rotate-180',
            disabled ? 'text-gray-400' : 'text-gray-600'
          )}
        />
      </button>

      {/* Меню */}
      {open && !disabled && (
        <div
          className="
            absolute left-0 z-20 mt-1 bg-white border border-gray-200 
            rounded-xl shadow-lg p-1 whitespace-nowrap
          "
          style={{
            minWidth: '100%',
            width: 'max-content',
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={clsx(
                `
                  px-3 py-2 text-sm cursor-pointer transition-colors rounded-lg
                `,
                value == opt.value
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'hover:bg-gray-100'
              )}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Select;
