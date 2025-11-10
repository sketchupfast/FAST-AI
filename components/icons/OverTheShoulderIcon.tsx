
import React from 'react';

export const OverTheShoulderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M4 8c0 -2.5 2 -4 4 -4h1.5" />
    <path d="M9.5 4a4 4 0 0 1 4 4v1.5" />
    <path d="M13.5 9.5a4 4 0 0 0 4 -4" />
    <path d="M4 12v3a1 1 0 0 0 1 1h1" />
    <path d="M17.5 4a4 4 0 0 1 0 8" />
    <path d="M15 16h4v4h-4z" />
  </svg>
);
