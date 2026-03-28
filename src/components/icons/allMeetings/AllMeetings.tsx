export function AllMeetings({
  width = 24,
  height = 24,
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
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip0_315_34595)">
        <path
          d="M22 4H2V19H9.5L12 21.5L14.5 19H22V4Z"
          stroke="#37A8FF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 9.5V13.5"
          stroke="#37A8FF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M10 8V15"
          stroke="#37A8FF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M14 10.5V12.5"
          stroke="#37A8FF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M18 9.5459V13.5459"
          stroke="#37A8FF"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_315_34595">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export default AllMeetings;
