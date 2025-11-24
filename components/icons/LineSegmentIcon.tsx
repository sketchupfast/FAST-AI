
import React from 'react';

export const LineSegmentIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M6 18l12 -12" />
    <path d="M6 18a2 2 0 1 0 -2 2" />
    <path d="M18 6a2 2 0 1 0 2 -2" />
  </svg>
);
