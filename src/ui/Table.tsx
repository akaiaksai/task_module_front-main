import {
  ReactNode,
  HTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from 'react';

export function Table({
  children,
  className,
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <table
      className={`w-full border-separate border-spacing-y-2 border-spacing-x-0 ${className || ''}`}
    >
      {children}
    </table>
  );
}
export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="relative bg-neutral-50 text-sm text-neutral-600">
      {children}
    </thead>
  );
}
export function TR({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`border-b last:border-b-0 ${className || ''}`} {...rest}>
      {children}
    </tr>
  );
}
export function TH({
  children,
  className,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & { children: ReactNode }) {
  return (
    <th
      className={`text-left py-3 px-3 font-normal ${className || ''}`}
      {...rest}
    >
      {children}
      <span className="absolute left-5 right-5 bottom-1 h-[1px] bg-gray-300 block"></span>
    </th>
  );
}

export function TD({
  children,
  className,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { children: ReactNode }) {
  return (
    <td className={`px-3 ${className || ''}`} {...rest}>
      {children}
    </td>
  );
}
