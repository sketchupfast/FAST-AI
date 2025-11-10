
import React from 'react';

export const SquareDashedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M8 4h-2a2 2 0 0 0 -2 2v2" />
    <path d="M4 16v2a2 2 0 0 0 2 2h2" />
    <path d="M16 4h2a2 2 0 0 1 2 2v2" />
    <path d="M20 16v2a2 2 0 0 1 -2 2h-2" />
    <path d="M12 4v.01" />
    <path d="M4 12h.01" />
    <path d="M12 20v.01" />
    <path d="M20 12h.01" />
    <path d="M8 12h.01" />
    <path d="M12 8v.01" />
    <path d="M12 16v.01" />
    <path d="M16 12h.01" />
  </svg>
);