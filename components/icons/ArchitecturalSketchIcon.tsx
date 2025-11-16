
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
    <path d="M3 20l18 0" />
    <path d="M5 20v-12l7 -4l7 4v12" />
    <path d="M9 20v-8h6v8" />
    <path d="M9 12h6" />
    <path d="M3 12h2" />
    <path d="M19 12h2" />
  </svg>
);
