import { clsx } from 'clsx';
import { TextareaHTMLAttributes, forwardRef } from 'react';

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={clsx(
        'w-full rounded-2xl border px-3 py-2 text-[16px] outline-none focus:ring-2 focus:ring-neutral-200',
        className
      )}
      {...rest}
    />
  )
);

Textarea.displayName = 'Textarea';

export default Textarea;
