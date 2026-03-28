import clsx from 'clsx';

export interface ModeOption<T> {
  value: T;
  label: string;
}

interface ModeSwitcherProps<T extends string> {
  modes: ModeOption<T>[];
  active: T;
  onChange: (mode: T) => void;

  containerClass?: string;
  buttonClass?: string;
  activeButtonClass?: string;
  inactiveButtonClass?: string;
}

export function ModeSwitcher<T extends string>({
  modes,
  active,
  onChange,
  containerClass = 'flex rounded-[7px] overflow-hidden shadow-soft',
  buttonClass = 'px-3 py-2 text-[14px] transition-colors',
  activeButtonClass = 'bg-[#8AE6FF26] ui-glow-desktop border border-[#8AE6FF80]',
  inactiveButtonClass = 'bg-[#8AE6FF26] hover:bg-[#8ae6ff67] text-white',
}: ModeSwitcherProps<T>) {
  return (
    <div className={containerClass}>
      {modes.map((m, i) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={clsx(
            buttonClass,
            i === 0 && 'rounded-l-[7px]',
            i === 2 && 'rounded-r-[7px]',
            active === m.value ? activeButtonClass : inactiveButtonClass
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
