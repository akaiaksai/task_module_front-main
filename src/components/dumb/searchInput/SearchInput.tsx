import { Search } from 'lucide-react';
import clsx from 'clsx';

interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  iconClassName?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Поиск',
  className = '',
  inputClassName = '',
  iconClassName = '',
}: SearchInputProps) {
  return (
    <div
      className={clsx(
        'flex items-center rounded-[7px] border border-[#66666633] bg-white px-5 py-1',
        className
      )}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'flex-1 min-w-0 bg-transparent outline-none text-[16px] leading-[130%] text-black font-normal placeholder-[#6E6E6E]',
          inputClassName
        )}
      />

      <Search
        className={clsx('w-4 h-4 text-[#6E6E6E] flex-shrink-0', iconClassName)}
      />
    </div>
  );
}
