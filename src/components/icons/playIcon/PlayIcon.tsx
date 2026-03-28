export function PlayIcon({
  width = 36,
  height = 36,
  className = '',
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="0.25"
        y="0.25"
        width="35.2578"
        height="35.2578"
        rx="17.6289"
        stroke="white"
        strokeWidth="0.5"
      />
      <path d="M14.5 11.5L24 18L14.5 24.5V11.5Z" fill="white" />
    </svg>
  );
}
