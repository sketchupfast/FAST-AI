
import React from 'react';

export const DownlightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M3 12h18" />
    <path d="M12 3v9" />
    <path d="M7.8 16l-2.6 5" />
    <path d="M16.2 16l2.6 5" />
  </svg>
);
