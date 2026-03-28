export function SandClock({
  width = 8,
  height = 11,
  stroke = '#2A2D61',
  className = '',
}: {
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 8 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip0_2038_14509)">
        <path
          d="M1.28906 3.20825H6.33073"
          stroke={stroke}
          strokeWidth="0.916667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M1.05859 9.16667V8.25C1.05859 7.52065 1.34833 6.82118 1.86405 6.30546C2.37978 5.78973 3.07925 5.5 3.80859 5.5C4.53794 5.5 5.23741 5.78973 5.75314 6.30546C6.26886 6.82118 6.55859 7.52065 6.55859 8.25V9.16667C6.55859 9.28822 6.51031 9.4048 6.42435 9.49076C6.3384 9.57671 6.22182 9.625 6.10026 9.625H1.51693C1.39537 9.625 1.27879 9.57671 1.19284 9.49076C1.10688 9.4048 1.05859 9.28822 1.05859 9.16667Z"
          stroke={stroke}
          strokeWidth="0.916667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M1.05859 1.83333V2.75C1.05859 3.47935 1.34833 4.17882 1.86405 4.69454C2.37978 5.21027 3.07925 5.5 3.80859 5.5C4.53794 5.5 5.23741 5.21027 5.75314 4.69454C6.26886 4.17882 6.55859 3.47935 6.55859 2.75V1.83333C6.55859 1.71178 6.51031 1.5952 6.42435 1.50924C6.3384 1.42329 6.22182 1.375 6.10026 1.375H1.51693C1.39537 1.375 1.27879 1.42329 1.19284 1.50924C1.10688 1.5952 1.05859 1.71178 1.05859 1.83333V1.83333Z"
          stroke={stroke}
          strokeWidth="0.916667"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_2038_14509">
          <rect width="7.61538" height="11" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
