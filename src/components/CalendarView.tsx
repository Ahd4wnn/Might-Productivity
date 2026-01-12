import { useMemo, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { eachDayOfInterval, format, subYears, isSameDay, getDay } from 'date-fns';
import { X } from 'lucide-react';

export function CalendarView() {
    const { entries, categories } = useStore();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Generate last 365 days
    const dates = useMemo(() => {
        const end = new Date();
        const start = subYears(end, 1);
        return eachDayOfInterval({ start, end });
    }, []);

    // Process data for heatmap
    const heatmapData = useMemo(() => {
        const data = new Map<string, number>();
        let maxMinutes = 0;
        let currentStreak = 0;
        let productiveDays = 0; // > 8h
        let bestDay = { date: '', minutes: 0 };

        entries.forEach(e => {
            const dateStr = format(new Date(e.timestamp), 'yyyy-MM-dd');
            const current = data.get(dateStr) || 0;
            const newTotal = current + (e.duration_minutes || 0);
            data.set(dateStr, newTotal);

            if (newTotal > maxMinutes) {
                maxMinutes = newTotal;
                bestDay = { date: dateStr, minutes: newTotal };
            }
        });

        // Calculate stats
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        let tempStreak = 0;

        // Iterate backwards from yesterday for streak
        for (let i = 0; i < 365; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = format(d, 'yyyy-MM-dd');
            const minutes = data.get(dateStr) || 0;

            if (minutes > 0) {
                tempStreak++;
            } else if (dateStr !== todayStr) { // Allow today to be 0 and still keep streak from yesterday
                currentStreak = tempStreak;
                tempStreak = 0;
            }

            if (minutes >= 480) productiveDays++; // 8 hours
        }
        if (currentStreak === 0 && tempStreak > 0) currentStreak = tempStreak; // If streak is active today

        return { data, productiveDays, currentStreak, bestDay };
    }, [dates, entries]);

    const getProductivityLevel = (minutes: number) => {
        const hours = minutes / 60;
        if (minutes === 0) return 0;
        if (hours < 2) return 1;
        if (hours < 4) return 2;
        if (hours < 6) return 3;
        if (hours < 8) return 4;
        return 5;
    };

    const getColor = (level: number) => {
        switch (level) {
            case 0: return 'bg-[#F5F5F5]';
            case 1: return 'bg-[#D1F4D1]';
            case 2: return 'bg-[#9AE89A]';
            case 3: return 'bg-[#5FCF5F]';
            case 4: return 'bg-[#2FA72F]';
            case 5: return 'bg-[#1D7A1D]';
            default: return 'bg-[#F5F5F5]';
        }
    };

    // Correct grid generation for Month/Week/Day layout
    const gridColumns = useMemo(() => {
        const cols: (Date | null)[][] = [];
        let currentWeek: (Date | null)[] = Array(7).fill(null);

        dates.forEach((date) => {
            const dayOfWeek = getDay(date); // 0 = Sun, 6 = Sat
            currentWeek[dayOfWeek] = date;

            if (dayOfWeek === 6) { // End of week
                cols.push(currentWeek);
                currentWeek = Array(7).fill(null);
            }
        });

        if (currentWeek.some(d => d !== null)) {
            cols.push(currentWeek);
        }

        return cols;
    }, [dates]);

    const getEntriesForDate = (date: Date) => {
        return entries.filter(e => isSameDay(new Date(e.timestamp), date));
    };

    const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'Other';

    return (
        <div className="animate-in fade-in duration-300">
            <div className="mb-10">
                <h1 className="text-2xl font-semibold mb-2">Calendar</h1>
                <p className="text-sm text-text-secondary">Your productivity overview</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <Card className="p-6">
                    <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Fully Productive Days</p>
                    <p className="text-3xl font-semibold">{heatmapData.productiveDays}</p>
                    <p className="text-xs text-text-tertiary mt-1">Target: 8h/day</p>
                </Card>
                <Card className="p-6">
                    <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Current Streak</p>
                    <p className="text-3xl font-semibold">{heatmapData.currentStreak} <span className="text-sm font-normal text-text-secondary">days</span></p>
                </Card>
                <Card className="p-6">
                    <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">Best Day</p>
                    <p className="text-xl font-semibold">
                        {heatmapData.bestDay.date ? format(new Date(heatmapData.bestDay.date), 'MMM d') : '-'}
                    </p>
                    <p className="text-sm text-text-secondary">
                        {heatmapData.bestDay.minutes ? `${Math.floor(heatmapData.bestDay.minutes / 60)}h ${heatmapData.bestDay.minutes % 60}m` : '0h'}
                    </p>
                </Card>
            </div>

            {/* Heatmap */}
            <Card className="p-8 overflow-x-auto">
                <div className="flex gap-[2px] min-w-max">
                    {/* Day Labels */}
                    <div className="flex flex-col gap-[2px] mr-2 pt-[14px]">
                        <span className="text-[10px] text-gray-400 h-[12px]"></span>
                        <span className="text-[10px] text-gray-400 h-[12px] leading-[12px]">Mon</span>
                        <span className="text-[10px] text-gray-400 h-[12px]"></span>
                        <span className="text-[10px] text-gray-400 h-[12px] leading-[12px]">Wed</span>
                        <span className="text-[10px] text-gray-400 h-[12px]"></span>
                        <span className="text-[10px] text-gray-400 h-[12px] leading-[12px]">Fri</span>
                        <span className="text-[10px] text-gray-400 h-[12px]"></span>
                    </div>

                    {gridColumns.map((week, i) => (
                        <div key={i} className="flex flex-col gap-[2px]">
                            {week.map((day, j) => {
                                if (!day) return <div key={j} className="w-[12px] h-[12px]" />;

                                const dateStr = format(day, 'yyyy-MM-dd');
                                const minutes = heatmapData.data.get(dateStr) || 0;
                                const level = getProductivityLevel(minutes);

                                return (
                                    <div
                                        key={dateStr}
                                        onClick={() => setSelectedDate(day)}
                                        className={`w-[12px] h-[12px] rounded-[2px] cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-gray-300 transition-all ${getColor(level)}`}
                                        title={`${format(day, 'MMM d, yyyy')}: ${Math.floor(minutes / 60)}h ${minutes % 60}m`}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-4 text-xs text-text-tertiary">
                    <span>Less</span>
                    <div className="flex gap-[2px]">
                        {[0, 1, 2, 3, 4, 5].map(l => (
                            <div key={l} className={`w-[12px] h-[12px] rounded-[2px] ${getColor(l)}`} />
                        ))}
                    </div>
                    <span>More</span>
                </div>
            </Card>

            {/* Modal / Details Panel */}
            {selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px]" onClick={() => setSelectedDate(null)}>
                    <Card className="w-full max-w-md p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold">{format(selectedDate, 'EEEE, MMMM d')}</h3>
                                <p className="text-sm text-text-secondary">
                                    {Math.floor((heatmapData.data.get(format(selectedDate, 'yyyy-MM-dd')) || 0) / 60)}h {(heatmapData.data.get(format(selectedDate, 'yyyy-MM-dd')) || 0) % 60}m tracked
                                </p>
                            </div>
                            <button onClick={() => setSelectedDate(null)} className="p-1 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {getEntriesForDate(selectedDate).length === 0 ? (
                                <p className="text-sm text-text-tertiary text-center py-8">No activity recorded</p>
                            ) : (
                                getEntriesForDate(selectedDate).map(e => (
                                    <div key={e.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-text-primary">{e.activity}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge>{getCategoryName(e.category_id)}</Badge>
                                                <span className="text-xs text-text-tertiary">{format(new Date(e.timestamp), 'h:mm a')}</span>
                                            </div>
                                        </div>
                                        {e.duration_minutes && (
                                            <span className="text-sm font-medium text-text-secondary">{e.duration_minutes}m</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
