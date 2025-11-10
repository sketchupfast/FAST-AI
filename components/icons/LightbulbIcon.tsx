
import React from 'react';

export const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-11.625a6.01 6.01 0 00-1.5 11.625zM12 18v2.25M12 18h.008v.008H12v-.008zm0 0H9.75m3 0h2.25m-2.25 0V15m0 0a2.25 2.25 0 00-2.25-2.25H9.75a2.25 2.25 0 00-2.25 2.25M12 15v3m0 0a2.25 2.25 0 002.25 2.25h.75a2.25 2.25 0 002.25-2.25v-3a2.25 2.25 0 00-2.25-2.25H12a2.25 2.25 0 00-2.25 2.25v.75"
    />
  </svg>
);