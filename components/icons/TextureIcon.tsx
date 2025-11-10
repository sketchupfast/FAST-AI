
import React from 'react';

export const TextureIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
        {...props}
    >
        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
        <path d="M6 3h-2a1 1 0 0 0 -1 1v2" />
        <path d="M18 3h2a1 1 0 0 1 1 1v2" />
        <path d="M6 21h-2a1 1 0 0 1 -1 -1v-2" />
        <path d="M18 21h2a1 1 0 0 0 1 -1v-2" />
        <path d="M9 6v12" />
        <path d="M15 6v12" />
        <path d="M6 9h12" />
        <path d="M6 15h12" />
    </svg>
);
