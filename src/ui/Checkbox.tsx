import { cn } from '@/lib/utils'; // Утилита для объединения классов
import { FC } from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  variant?: 'blue' | 'green' | 'purple' | 'orange' | 'default';
  className?: string;
  showRoleFilters?: boolean;
}

const Checkbox: FC<CheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}) => {
  return (
    <label
      className={cn(
        'flex items-center gap-2 text-sm cursor-pointer transition-colors duration-200',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={cn(
          'w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600',
          disabled && 'cursor-not-allowed'
        )}
      />
      <span
        className={cn(
          'whitespace-nowrap font-medium',
          disabled && 'text-gray-500'
        )}
      >
        {label}
      </span>
    </label>
  );
};

export default Checkbox;
