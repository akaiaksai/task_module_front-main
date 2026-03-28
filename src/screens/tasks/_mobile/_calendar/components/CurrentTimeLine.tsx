interface CurrentTimeLineProps {
  startHour: number;
  hourHeight: number;
  totalHeight: number;
  currentTimeColor: string;
}

export const CurrentTimeLine = ({
  startHour,
  hourHeight,
  totalHeight,
  currentTimeColor,
}: CurrentTimeLineProps) => {
  const now = new Date();
  const offset = ((now.getHours() - startHour) * 60 + now.getMinutes()) / 60;
  const position = offset * hourHeight;

  if (position < 0 || position > totalHeight) {
    return null;
  }

  return (
    <div
      className="absolute left-0 z-20 pointer-events-none"
      style={{ top: `${position}px`, width: '100%' }}
    >
      <div
        className="absolute left-0 right-0 h-0.5"
        style={{ backgroundColor: currentTimeColor }}
      />
    </div>
  );
};
