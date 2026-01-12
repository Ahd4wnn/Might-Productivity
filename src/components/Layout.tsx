import React from 'react';

export type View = 'today' | 'week' | 'calendar' | 'insights' | 'all' | 'categories' | 'summaries' | 'goals';

export interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <main className="flex-1 w-full ml-[220px] min-h-screen">
            <div className="max-w-[1200px] mx-auto px-16 py-12">
                {children}
            </div>
        </main>
    );
}
