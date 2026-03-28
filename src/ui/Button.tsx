import { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};
export default function Button({
  className,
  variant = 'primary',
  ...rest
}: Props) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-2xl px-3 py-2 text-sm font-medium transition active:scale-[.98]',
        className,
        variant === 'primary'
          ? 'bg-black text-white hover:bg-neutral-800'
          : 'bg-transparent hover:bg-neutral-100'
      )}
      {...rest}
    />
  );
}
