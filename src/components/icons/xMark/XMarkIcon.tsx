import React from 'react';

interface XMarkIconProps {
  color: string;
  width?: number;
  height?: number;
  className?: string;
}

export const XMarkIcon: React.FC<XMarkIconProps> = ({
  color,
  width = 17,
  height = 17,
  className,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.274587 0.274587C0.640704 -0.0915292 1.2343 -0.0915292 1.60041 0.274587L8.4375 7.11167L15.2746 0.274588C15.6407 -0.0915281 16.2343 -0.0915281 16.6004 0.274588C16.9665 0.640705 16.9665 1.2343 16.6004 1.60041L9.76333 8.4375L16.6004 15.2746C16.9665 15.6407 16.9665 16.2343 16.6004 16.6004C16.2343 16.9665 15.6407 16.9665 15.2746 16.6004L8.4375 9.76333L1.60041 16.6004C1.2343 16.9665 0.640704 16.9665 0.274588 16.6004C-0.091529 16.2343 -0.091529 15.6407 0.274588 15.2746L7.11167 8.4375L0.274587 1.60041C-0.0915292 1.2343 -0.0915292 0.640704 0.274587 0.274587Z"
        fill={color}
      />
    </svg>
  );
};
