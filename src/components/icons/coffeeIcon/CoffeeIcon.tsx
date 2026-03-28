export function CoffeeIcon({
  width = 24,
  height = 24,
  className = '',
  fill = '#005337',
}: {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip0_315_34462)">
        <path
          d="M20.5556 1H1V13.2222C1 15.9233 3.18778 18.1111 5.88889 18.1111H13.2222C15.9233 18.1111 18.1111 15.9233 18.1111 13.2222V9.55556H20.5556C21.9061 9.55556 23 8.46167 23 7.11111V3.44444C23 2.09389 21.9061 1 20.5556 1ZM20.5556 7.11111H18.1111V3.44444H20.5556V7.11111ZM1 20.5556H20.5556V23H1V20.5556Z"
          fill={fill}
        />
      </g>
      <defs>
        <clipPath id="clip0_315_34462">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export default CoffeeIcon;
