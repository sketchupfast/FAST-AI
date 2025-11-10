
import React from 'react';

export const EyeLevelIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M3 12l18 0" />
    <path d="M6 12l-1.5 -4" />
    <path d="M18 12l1.5 -4" />
    <path d="M6 12l-1.5 4" />
    <path d="M18 12l1.5 4" />
  </svg>
);
