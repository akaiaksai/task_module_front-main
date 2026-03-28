import { WeekPicker } from '@/components/dumb';
import { cn } from '@/lib/utils';
import { useTaskFiltersStore } from '@/store/task-filters';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Meets } from './Meets';
import { Slots } from './Slots';

interface MeetingModalNewProps {
  open: boolean;
  onClose: () => void;
}

export const MeetingModalNew = ({ onClose, open }: MeetingModalNewProps) => {
  const [activeTab, setActiveTab] = useState<'Встречи' | 'Слоты'>('Встречи');
  const { selectedDate, setSelectedDate } = useTaskFiltersStore();

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
  }, [selectedDate, setSelectedDate]);

  if (!open) {
    return null;
  }
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center text-white">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative ui-glow rounded-[20px] px-[24px] py-[44px] max-h-[90dvh] overflow-scroll bg-mobile-header max-w-[1010px] w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-[24px] font-semibold lh-[130%]">
            {activeTab === 'Встречи' ? 'Встречи' : 'Свободные слоты'}
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="flex gap-[60px] items-center pt-[44px] pb-[24px] justify-center">
          {['Встречи', 'Слоты'].map((tab) => (
            <button
              key={tab}
              className={cn(
                'rounded-[8px] border mw-[100px] px-4 py-2 bg-[#8AE6FF26] transition-all',
                activeTab === tab
                  ? 'border-[#8AE6FF80] ui-glow'
                  : 'opacity-50 border-transparent'
              )}
              onClick={() => setActiveTab(tab as 'Встречи' | 'Слоты')}
            >
              {tab}
            </button>
          ))}
        </div>
        <WeekPicker
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
        <div className="mt-10">
          {activeTab === 'Встречи' ? <Meets /> : <Slots />}
        </div>
      </div>
    </div>,
    document.body
  );
};
