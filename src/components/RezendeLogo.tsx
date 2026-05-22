import React from 'react';

export const RezendeLogo = ({ className = "w-6 h-6", strokeWidth = "2.5" }: { className?: string, strokeWidth?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    {/* Calendar outline */}
    <rect x="3" y="4" width="18" height="18" rx="4" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="16" y1="2" x2="16" y2="6" />
    
    {/* 'R' and '.' inside */}
    <path d="M9 10v6" />
    <path d="M9 10h2.5a2 2 0 0 1 0 4H9" />
    <path d="M11.5 14l2 2" />
    
    <circle cx="15.5" cy="15.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

