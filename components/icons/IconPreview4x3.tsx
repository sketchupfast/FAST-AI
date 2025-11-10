
import React from 'react';

export const IconPreview4x3: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g clipPath="url(#clip_4x3_preview)">
      <rect width="24" height="24" fill="#A5F3FC" />
      <path d="M-2 15L7 8L13 14L18 10L26 17V24H-2V15Z" fill="#22C55E" />
      <circle cx="20" cy="6" r="3" fill="#FACC15" />
    </g>
    <rect x="3" y="5.25" width="18" height="13.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <defs>
      <clipPath id="clip_4x3_preview">
        <rect x="3" y="5.25" width="18" height="13.5" rx="2" />
      </clipPath>
    </defs>
  </svg>
);
