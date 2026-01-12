import { Calendar, LayoutDashboard, BarChart3, List, Settings, LogOut, Tags, CalendarDays, Trophy, Target } from 'lucide-react';
import { CategoryNotification } from './CategoryNotification';
import { cn } from '../lib/utils';
import { type View } from './Layout';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../hooks/useStore';

interface SidebarProps {
    currentView: View;
    onViewChange: (view: View) => void;
    onOpenSettings: () => void;
}

export function Sidebar({ currentView, onViewChange, onOpenSettings }: SidebarProps) {
    const { user, signOut } = useAuth();
    const { profile } = useStore();

    const NavItem = ({ view, icon: Icon, label }: { view: View; icon: any; label: string }) => (
        <button
            onClick={() => onViewChange(view)}
            className={cn(
                'w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150',
                currentView === view
                    ? 'bg-gray-100 text-black'
                    : 'text-text-secondary hover:bg-gray-50 hover:text-black'
            )}
        >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );

    return (
        <aside className="fixed left-0 top-0 h-screen w-[220px] bg-background-paper border-r border-border flex flex-col z-40">
            {/* Logo Area */}
            <div className="p-6 pb-8">
                <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">M</span>
                    </div>
                    <span className="text-lg font-bold tracking-tight text-black">Might</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
                <NavItem view="today" icon={LayoutDashboard} label="Today" />
                <NavItem view="week" icon={Calendar} label="This Week" />
                <NavItem view="goals" icon={Target} label="Goals" />
                <NavItem view="calendar" icon={CalendarDays} label="Calendar" />
                <NavItem view="summaries" icon={Trophy} label="Summaries" />
                <NavItem view="insights" icon={BarChart3} label="Insights" />
                <NavItem view="all" icon={List} label="All Entries" />
                <NavItem view="categories" icon={Tags} label="Categories" />
            </nav>

            <CategoryNotification />

            {/* Bottom Section */}
            <div className="p-4 border-t border-border space-y-1">
                <button
                    onClick={onOpenSettings}
                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-gray-50 hover:text-black transition-all duration-150"
                >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                </button>

                <div className="pt-2 px-3 flex items-center justify-between group">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-medium text-gray-600 uppercase">
                            {profile?.username?.charAt(0) || user?.email?.charAt(0) || 'G'}
                        </div>
                        <span className="text-xs text-text-tertiary truncate max-w-[90px]">
                            {profile?.username || user?.email || 'Guest'}
                        </span>
                    </div>

                    <button
                        onClick={() => signOut()}
                        className="text-text-tertiary hover:text-red-600 transition-colors p-1"
                        title="Sign out"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
