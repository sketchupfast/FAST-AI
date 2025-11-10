
import React from 'react';

export const SunriseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
       <path d="M3 17h1m16 0h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7m-9.7 -5.7l.7 .7m6.4 -.7l-.7 .7" />
       <path d="M12 12a4 4 0 0 1 -4 4h8a4 4 0 0 1 -4 -4v0" />
       <path d="M3 21l18 0" />
    </svg>
);
