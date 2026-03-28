export function Pause({
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
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.2539 9.44141H22.9414C23.8734 9.44141 24.6289 10.1969 24.6289 11.1289V24.6289C24.6289 25.5609 23.8734 26.3164 22.9414 26.3164H21.2539C20.3219 26.3164 19.5664 25.5609 19.5664 24.6289V11.1289C19.5664 10.1969 20.3219 9.44141 21.2539 9.44141Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.8164 9.44141H14.5039C15.4359 9.44141 16.1914 10.1969 16.1914 11.1289V24.6289C16.1914 25.5609 15.4359 26.3164 14.5039 26.3164H12.8164C11.8844 26.3164 11.1289 25.5609 11.1289 24.6289V11.1289C11.1289 10.1969 11.8844 9.44141 12.8164 9.44141Z"
        fill="white"
      />
    </svg>
  );
}

export default Pause;
