import React from 'react';

export function Card({ children, className = '', ...props }) {
  return (
    // Spread the rest of the props onto the underlying div
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}