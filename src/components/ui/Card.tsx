import React from 'react';

// Extend React.HTMLAttributes<HTMLDivElement> to allow all standard div attributes
// This includes 'onClick', 'style', 'id', 'data-foo', etc.
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  // We still keep children and className as they are explicitly used
  children: React.ReactNode;
  // className is already covered by React.HTMLAttributes, but can be kept for clarity
  className?: string;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    // Spread the rest of the props onto the underlying div
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

// CardHeader and CardContent can also be made to accept HTML attributes
// if you ever need to add event handlers or other attributes to them directly.
// For now, let's assume they don't need to be clickable themselves.
export function CardHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
}