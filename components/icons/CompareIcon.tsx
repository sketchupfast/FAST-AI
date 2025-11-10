
import React from 'react';

export const CompareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <polyline points="15 18 9 12 15 6"></polyline>
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);