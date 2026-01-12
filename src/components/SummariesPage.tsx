import { useStore } from '../hooks/useStore';
import { Card } from './ui/Card';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, BarChart3, Trophy } from 'lucide-react';

export function SummariesPage() {
    const { summaries } = useStore();

    // If a summary is selected, we could show a devoted detail view, but for now let's just use the list view 
    // and maybe expand items. Or just a simple list.
    // The plan mentioned a "Summaries" page showing past weeks.

    if (!summaries || summaries.length === 0) {
        return (
            <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
                <div className="mb-10">
                    <h1 className="text-2xl font-semibold mb-2">Weekly Summaries</h1>
                    <p className="text-sm text-text-secondary">Your AI-generated progress reports will appear here.</p>
                </div>
                <div className="border border-dashed border-gray-200 rounded-xl p-12 text-center">
                    <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-text-tertiary">No summaries yet. Keep tracking to generate your first report next week!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-300 space-y-8">
            <div className="mb-10">
                <h1 className="text-2xl font-semibold mb-2">Weekly Summaries</h1>
                <p className="text-sm text-text-secondary">Track your progress week over week.</p>
            </div>

            <div className="grid gap-6">
                {summaries.map((summary) => {
                    const stats = summary.stats || {};
                    const topCat = stats.topCategory || { name: 'None' };

                    return (
                        <Card key={summary.id} className="p-6 transition-all hover:shadow-md hover:border-gray-300 group">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 p-2 rounded-lg">
                                            <Calendar className="w-5 h-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {format(parseISO(summary.week_start), 'MMMM d')} - {format(parseISO(summary.week_end), 'MMMM d, yyyy')}
                                            </h3>
                                            <p className="text-xs text-text-tertiary">Weekly Report</p>
                                        </div>
                                    </div>

                                    <div className="pl-0 md:pl-14">
                                        <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
                                            {summary.ai_summary}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-4 pl-0 md:pl-14 pt-2">
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                                            {Math.floor(summary.total_minutes / 60)}h {summary.total_minutes % 60}m
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                            <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
                                            {summary.total_entries} Activities
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                            <Trophy className="w-3.5 h-3.5 text-orange-500" />
                                            {topCat.name}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
