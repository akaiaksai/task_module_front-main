import { clsx } from 'clsx';

export default function Badge({
  children,
  color = 'gray',
}: {
  children: React.ReactNode;
  color?: 'gray' | 'green' | 'blue' | 'red' | 'amber';
}) {
  const map: Record<string, string> = {
    gray: 'bg-neutral-100 text-neutral-700',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-800',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-[clamp(0.3rem,0.4vw,0.5rem)] py-[clamp(0.1rem,0.15vw,0.25rem)] text-[clamp(0.65rem,0.6rem+0.3vw,0.8rem)]  font-medium whitespace-nowrap',
        map[color]
      )}
    >
      {children}
    </span>
  );
}
