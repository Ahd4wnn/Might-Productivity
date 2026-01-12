import { useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { Card } from './ui/Card';
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, format } from 'date-fns';

export function WeekView() {
    const { entries } = useStore();

    const weekData = useMemo(() => {
        const start = startOfWeek(new Date(), { weekStartsOn: 1 });
        const end = endOfWeek(new Date(), { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start, end });

        // Filter entries for this week
        const weeklyEntries = entries.filter(e => {
            const d = new Date(e.timestamp);
            return d >= start && d <= end;
        });

        const totalTime = weeklyEntries.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
        const totalActivities = weeklyEntries.length;

        // Active days count
        const activeDays = new Set(weeklyEntries.map(e => new Date(e.timestamp).toDateString())).size;

        return { days, weeklyEntries, totalTime, totalActivities, activeDays, start, end };
    }, [entries]);

    return (
        <div className="space-y-10 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">This Week</h1>
                <p className="text-sm text-text-secondary">{format(weekData.start, 'MMM d')} - {format(weekData.end, 'MMM d')}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <SummaryCard label="Total Entries" value={weekData.totalActivities.toString()} />
                <Card className="p-6 flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-2">Time Well Spent</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-semibold text-text-primary">
                                {Math.floor(weekData.totalTime / 60)}h {weekData.totalTime % 60}m
                            </p>
                            <p className="text-xs text-text-secondary">
                                {((weekData.totalTime / 60 / 112) * 100).toFixed(1)}% of waking hours
                            </p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 h-1 mt-4 rounded-full overflow-hidden">
                        <div
                            className="bg-black h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(((weekData.totalTime / 60 / 112) * 100), 100)}%` }}
                        />
                    </div>
                </Card>
                <SummaryCard label="Active Days" value={`${weekData.activeDays}/7`} />
            </div>

            {/* Daily Breakdown */}
            <div>
                <h2 className="text-base font-semibold mb-6">Daily Breakdown</h2>
                <div className="grid grid-cols-7 gap-4">
                    {weekData.days.map(day => {
                        const dayEntries = weekData.weeklyEntries.filter(e => isSameDay(new Date(e.timestamp), day));
                        const isToday = isSameDay(day, new Date());

                        return (
                            <Card key={day.toString()} className={`p-4 h-48 flex flex-col ${isToday ? 'ring-1 ring-black' : ''}`}>
                                <div className="text-xs font-medium text-text-tertiary mb-1 uppercase tracking-wider">
                                    {format(day, 'EEE')}
                                </div>
                                <div className="font-semibold text-lg mb-4">
                                    {format(day, 'd')}
                                </div>

                                <div className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
                                    {dayEntries.length === 0 ? (
                                        <div className="text-[10px] text-text-tertiary">No entries</div>
                                    ) : (
                                        dayEntries.map(e => (
                                            <div key={e.id} className="text-[11px] truncate text-text-secondary bg-gray-50 px-1.5 py-1 rounded">
                                                {e.activity}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ label, value }: { label: string, value: string }) {
    return (
        <Card className="p-6">
            <p className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-2">{label}</p>
            <p className="text-3xl font-semibold text-text-primary">{value}</p>
        </Card>
    );
}
