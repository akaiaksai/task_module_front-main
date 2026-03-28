interface TimeGridProps {
  hours: number[];
  hourHeight: number;
  backgroundColor?: string;
  lineColor: string;
}

export const TimeGrid = ({
  hours,
  hourHeight,
  backgroundColor,
  lineColor,
}: TimeGridProps) => (
  <div className="z-30 mt-4">
    {hours.map((hour: number, index: number) => (
      <div key={`time-${hour}-${index}`} className="relative">
        <div
          className="absolute left-0 border-t-[0.5px] opacity-30"
          style={{
            top: `${index * hourHeight + 8}px`,
            width: '100%',
            borderColor: lineColor,
          }}
        />
        <div
          className="absolute text-[14px] leading-[130%] tracking-[-0.5px] font-normal z-10"
          style={{
            top: `${index * hourHeight}px`,
            color: lineColor,
            backgroundColor,
          }}
        >
          {hour < 10 ? `0${hour}:00` : `${hour}:00`}
        </div>
      </div>
    ))}
  </div>
);
