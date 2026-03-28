interface MyTasksButtonProps {
  onClick?: () => void;
  className?: string;
  active?: boolean;
}

export function MyTasksButton({
  onClick,
  className = '',
  active,
}: MyTasksButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-[95px]
        px-2 py-1
        text-[#666666]
        shadow-card
        hover:text-gray-700
        text-sm
        transition-colors
        ${className}
      `}
    >
      {active ? 'Все задачи' : 'Мои задачи'}
    </button>
  );
}
