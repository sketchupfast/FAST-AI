
import React from 'react';

export const ArchitecturalSketchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M3 21h18" />
    <path d="M4 21v-11l2.5 -4.5l5.5 -2.5l5.5 2.5l2.5 4.5v11" />
    <path d="M12 21v-8" />
    <path d="M9 21v-4" />
    <path d="M15 21v-4" />
    <path d="M8 13h1" />
    <path d="M15 13h1" />
  </svg>
);
