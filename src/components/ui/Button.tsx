import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    'inline-flex items-center justify-center rounded-md font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
                    {
                        'bg-black text-white hover:opacity-80': variant === 'primary',
                        'bg-white border border-border text-text-primary hover:bg-gray-50': variant === 'secondary',
                        'bg-transparent text-text-secondary hover:text-text-primary hover:bg-gray-50': variant === 'ghost',
                        'bg-red-50 text-red-600 hover:bg-red-100': variant === 'destructive',
                        'h-8 px-3 text-[13px]': size === 'sm',
                        'h-9 px-4 text-sm': size === 'md',
                        'h-11 px-6 text-base': size === 'lg',
                        'h-9 w-9 p-2': size === 'icon',
                    },
                    className
                )}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                {children}
            </button>
        );
    }
);
