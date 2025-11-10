
import React from 'react';

export const CloseUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    {...props}>
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
    <path d="M3 12c0 -3.424 2.112 -6.33 5 -7.5" />
    <path d="M21 12c0 -3.424 -2.112 -6.33 -5 -7.5" />
    <path d="M6.5 17.5c2.25 1 4.75 1 7 0" />
  </svg>
);
