import { Children, ReactNode, useState } from 'react';

import { useClickOutside } from '@/hooks/ui/useClickOutside';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  label: string | ReactNode;
  children: ReactNode;
  className?: string;
  classNameButton?: string;
}

export const DropdownMenu = (props: DropdownMenuProps) => {
  const { label, className, classNameButton, children } = props;
  const [active, setActive] = useState(false);
  const menuRef = useClickOutside(() => setActive(false));

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        onClick={() => setActive((prev) => !prev)}
        className={cn(
          'w-full py-2 px-3 text-sm font-medium rounded-full transition-all shadow-lg bg-white text-gray-800 text-left',
          classNameButton
        )}
      >
        {label}
      </button>
      <ul
        className={cn(
          'absolute -top-2 left-0 p-2  rounded-md bg-white shadow-lg -translate-y-full flex flex-col gap-2 z-1 overflow-hidden',
          { hidden: !active }
        )}
      >
        {Children.map(children, (child, index) => (
          <li onClick={() => setActive(false)} key={index}>
            {child}
          </li>
        ))}
      </ul>
    </div>
  );
};
