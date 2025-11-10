
import React from 'react';

export const IconPreview3x4: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g clipPath="url(#clip_3x4_preview)">
      <rect width="24" height="24" fill="#A5F3FC" />
      <path d="M-2 15L7 8L13 14L18 10L26 17V24H-2V15Z" fill="#22C55E" />
      <circle cx="20" cy="6" r="3" fill="#FACC15" />
    </g>
    <rect x="5.25" y="3" width="13.5" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <defs>
      <clipPath id="clip_3x4_preview">
        <rect x="5.25" y="3" width="13.5" height="18" rx="2" />
      </clipPath>
    </defs>
  </svg>
);
