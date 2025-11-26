
import React from 'react';

export const MagicWandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M10.5 17.5l-5.5 5.5l-3 -3l5.5 -5.5" />
    <path d="M17 10l3.5 -3.5l-6 -6l-3.5 3.5" />
    <path d="M5.8 15.8l2.2 2.2" />
    <path d="M14 11l6 6" />
    <path d="M12 21l-3 -3" />
    <path d="M21 12l-3 -3" />
    <path d="M15 6l-3 -3" />
  </svg>
);
