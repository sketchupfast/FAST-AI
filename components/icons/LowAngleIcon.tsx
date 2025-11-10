
import React from 'react';

export const LowAngleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M3 5.5l5 3.5l5 -3.5l5 3.5l4 -2.5" />
    <path d="M3 10l5 3l5 -3l5 3l4 -2" />
    <path d="M12 13v7" />
    <path d="M9 17l3 3l3 -3" />
  </svg>
);
