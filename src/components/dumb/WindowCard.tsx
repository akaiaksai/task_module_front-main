import { X } from 'lucide-react';

interface WindowCardProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  titleClassName?: string;
}

export function WindowCard({
  title,
  onClose,
  children,
  titleClassName,
}: WindowCardProps) {
  return (
    <div className="font-roboto mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2
          className={`text-[18px] font-normal leading-[130%] ${titleClassName || 'text-[#1A1A1A]'}`}
        >
          {title}
        </h2>

        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5 text-black" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#0000000F] p-5 shadow-md">
        {children}
      </div>
    </div>
  );
}
