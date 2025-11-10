
import React from 'react';

export const CogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        {...props}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.343 3.94c.09-.542.56-1.008 1.11-1.212l2.296-.766c.498-.165 1.04.14 1.25.618l.21.473c.197.443.7.72 1.206.72h2.556c.58 0 1.044.437 1.124.994l.112.79c.066.467.433.841.908.973l2.22.653c.502.148.82.668.648 1.148l-.343.971a1.243 1.243 0 0 1-1.074.885l-2.622.337a1.125 1.125 0 0 0-1.004.832l-.338 2.623a1.243 1.243 0 0 1-.885 1.074l-.97.343c-.48.172-1-.146-1.148-.648l-.653-2.22a.908.908 0 0 0-.973-.908h-.79a1.125 1.125 0 0 0-.994-1.124l-2.556 0c-.506 0-.976-.277-1.206-.72l-.473-.21a1.25 1.25 0 0 1-.618-1.25l.766-2.296c.204-.55.67-1.02.212-1.11.212.112.212-.112z"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
        />
    </svg>
);
