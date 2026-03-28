import { clsx } from 'clsx';
import { InputHTMLAttributes, forwardRef } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement>;
const Input = forwardRef<HTMLInputElement, Props>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-2xl border px-3 py-2 text-[16px] outline-none focus:ring-2 focus:ring-neutral-200',
        className
      )}
      {...rest}
    />
  )
);
Input.displayName = 'Input';
export default Input;
