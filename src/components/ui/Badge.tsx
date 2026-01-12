import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
    variant?: 'default' | 'outline' | 'secondary';
}

export function Badge({ children, className, variant = 'default', ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors',
                variant === 'default' && 'bg-gray-100 text-gray-800 border border-transparent',
                variant === 'outline' && 'bg-transparent border',
                variant === 'secondary' && 'bg-indigo-50 text-indigo-700 border border-transparent',
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
}
