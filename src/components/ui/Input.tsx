import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="space-y-1.5 w-full">
                {label && <label className="text-xs font-medium text-text-secondary">{label}</label>}
                <input
                    ref={ref}
                    className={cn(
                        'flex h-9 w-full rounded-md border border-border bg-white px-3 py-1 text-sm placeholder:text-text-tertiary focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors duration-150',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
                        className
                    )}
                    {...props}
                />
                {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
        );
    }
);
