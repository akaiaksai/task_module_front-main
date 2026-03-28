import { Calendar, Clock } from 'lucide-react';
import { useRef } from 'react';

interface DateTimeInputProps {
  label: string;
  valueDate: string;
  valueTime: string;
  onChange?: (newDate: string, newTime: string) => void;
  readOnly?: boolean;
}

export const TimeBlock = () => {
  return (
    <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-200">
      {/* <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Учет времени</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 mb-1">Планируемое</div>
            <div className="text-lg font-bold text-blue-900">
              {timeEstimate ? formatTimeEstimate(timeEstimate) : "0 мин"}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-xs text-green-600 mb-1">Затрачено</div>
            <div className="text-lg font-bold text-green-900">0 мин</div>
          </div>
        </div>

        {timeEstimate && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Прогресс выполнения</span>
              <span className="font-medium">0%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: "0%" }}
              ></div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">История работы</h4>
          <div className="text-center py-6 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Время работы еще не учитывалось</p>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export function DateTimeInput({
  label,
  valueDate,
  valueTime,
  onChange,
  readOnly,
}: DateTimeInputProps) {
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px] text-[#2B2B2B]">{label}</span>

      <div className="flex items-center gap-2">
        <div
          className={`
            relative flex items-center
            border border-[#2B2B2B1F] rounded-xl px-3 py-2
            bg-white select-none
            ${readOnly ? 'cursor-default' : 'cursor-pointer'}
          `}
          onClick={() => !readOnly && dateRef.current?.showPicker()}
        >
          <Calendar className="w-4 h-4 text-[#2098E3] mr-1" />

          <span className="text-[14px] text-[#2B2B2B] mx-auto">
            {valueDate}
          </span>

          {!readOnly && (
            <input
              ref={dateRef}
              type="date"
              value={valueDate.split('.').reverse().join('-')}
              onChange={(e) =>
                onChange?.(
                  e.target.value.split('-').reverse().join('.'),
                  valueTime
                )
              }
              className="
                absolute inset-0 w-full h-full opacity-0 cursor-pointer
                appearance-none
                [&::-webkit-calendar-picker-indicator]:hidden
                [&::-webkit-inner-spin-button]:hidden
              "
            />
          )}
        </div>

        <div
          className={`
            relative flex items-center
            border border-[#2B2B2B1F] rounded-xl px-3 py-2
            bg-white select-none
            ${readOnly ? 'cursor-default' : 'cursor-pointer'}
          `}
          onClick={() => !readOnly && timeRef.current?.showPicker()}
        >
          <Clock className="w-4 h-4 text-[#5654E5] mr-1" />

          <span className="text-[14px] text-[#2B2B2B] mx-auto">
            {valueTime}
          </span>

          {!readOnly && (
            <input
              ref={timeRef}
              type="time"
              value={valueTime}
              onChange={(e) => onChange?.(valueDate, e.target.value)}
              className="
                absolute inset-0 w-full h-full opacity-0 cursor-pointer
                appearance-none
                [&::-webkit-inner-spin-button]:hidden
                [&::-webkit-calendar-picker-indicator]:hidden
              "
            />
          )}
        </div>
      </div>
    </div>
  );
}
