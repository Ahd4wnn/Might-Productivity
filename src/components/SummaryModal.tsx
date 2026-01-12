import { useRef, useEffect } from 'react';
import { X, Trophy, Calendar, Clock, BarChart3, ArrowRight } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { Button } from './ui/Button';
import { format, parseISO } from 'date-fns';

export function SummaryModal() {
    const { latestSummary, clearLatestSummary, profile } = useStore();
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                clearLatestSummary();
            }
        };

        if (latestSummary) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [latestSummary, clearLatestSummary]);

    if (!latestSummary) return null;

    const { week_start, week_end } = latestSummary as any; // Using any to bypass potential type mismatch if DB types lag

    // Safety check for stats from JSONB
    const safeStats = (latestSummary as any).stats || {};
    const safeTopCategory = safeStats.topCategory || { name: 'None', minutes: 0 };
    const totalHours = Math.floor((latestSummary.total_minutes || 0) / 60);
    const totalMins = (latestSummary.total_minutes || 0) % 60;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                ref={modalRef}
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 relative"
            >
                {/* Header with Confetti vibes (CSS gradient) */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <Trophy className="w-6 h-6 text-yellow-400" />
                            <h2 className="text-sm font-medium uppercase tracking-wider text-gray-300">Weekly Report</h2>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">You crushed it, {profile?.username || 'Partner'}!</h1>
                        <p className="text-gray-300">
                            {format(parseISO(week_start), 'MMM d')} - {format(parseISO(week_end), 'MMM d, yyyy')}
                        </p>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

                    <button
                        onClick={clearLatestSummary}
                        className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Key Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                            <div className="mx-auto w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{totalHours}h {totalMins}m</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Total Focus</div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                            <div className="mx-auto w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{latestSummary.active_days}/7</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Days Active</div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                            <div className="mx-auto w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-3">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{latestSummary.total_entries}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Activities</div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                            <div className="mx-auto w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-3">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div className="text-lg font-bold text-gray-900 truncate px-1">
                                {safeTopCategory.name}
                            </div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Top Focus</div>
                        </div>
                    </div>

                    {/* AI Summary */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            Analysis
                        </h3>
                        <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                            {latestSummary.ai_summary}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={clearLatestSummary} className="px-8">
                            Let's Go
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
