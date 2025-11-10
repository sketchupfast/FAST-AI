
import React from 'react';

export const SketchWatercolorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M14 10l-8.5 8.5" />
    <path d="M13.5 9.5l-5 5" />
    <path d="M16.5 6.5l-1 1" />
    <path d="M18.5 4.5l-1.5 1.5" />
    <path d="M3 21l8.5 -8.5" />
    <path d="M3 17.5l4 -4" />
    <path d="M15 6l4 -4" />
    <path d="M6 15l-3 3" />
    <path d="M18.5 9.5l2.5 -2.5" />
  </svg>
);