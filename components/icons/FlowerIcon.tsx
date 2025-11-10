
import React from 'react';

export const FlowerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5c-2.33 0-4.425-1.03-5.83-2.693m11.66 0c-1.405 1.663-3.5 2.693-5.83 2.693z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5c2.33 0 4.425 1.03 5.83 2.693m-11.66 0c1.405-1.663 3.5-2.693 5.83-2.693z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12c0 2.33-1.03 4.425-2.693 5.83m0-11.66C15.47 7.575 16.5 9.67 16.5 12z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12c0-2.33 1.03-4.425 2.693-5.83m0 11.66C8.53 16.425 7.5 14.33 7.5 12z" />
  </svg>
);
