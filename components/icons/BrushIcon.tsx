
import React from 'react';

export const BrushIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 19.82a2.25 2.25 0 0 1-1.272.772l-4.5 1.636a.75.75 0 0 1-.944-.943l1.636-4.5a2.25 2.25 0 0 1 .772-1.272l11.172-11.172v.001Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125h.008v.008h-.008V7.125Z" />
  </svg>
);