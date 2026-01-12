import { useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { Card } from './ui/Card';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { subDays, format, isSameDay, startOfDay } from 'date-fns';

export function InsightsView() {
    const { entries, categories } = useStore();

    const data = useMemo(() => {
        // 1. Activity Trend (Last 30 Days)
        const last30Days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), 29 - i));
        const trendData = last30Days.map(date => {
            const dayEntries = entries.filter(e => isSameDay(new Date(e.timestamp), date));
            return {
                date: format(date, 'MMM d'),
                activities: dayEntries.length,
            };
        });

        // 2. Category Distribution (Time Spent)
        const categoryData = categories.map(cat => {
            const catEntries = entries.filter(e => e.category_id === cat.id);
            const totalTime = catEntries.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
            return {
                name: cat.name,
                value: totalTime,
            };
        }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

        // 3. Streak
        let currentStreak = 0;
        const sortedDates = [...new Set(entries.map(e => startOfDay(new Date(e.timestamp)).getTime()))].sort((a, b) => b - a);
        if (sortedDates.length > 0) {
            const today = startOfDay(new Date()).getTime();
            const yesterday = subDays(new Date(), 1).getTime();
            if (sortedDates[0] === today || sortedDates[0] === yesterday) {
                currentStreak = 1;
                let checkDate = sortedDates[0];
                for (let i = 1; i < sortedDates.length; i++) {
                    const prevDate = subDays(new Date(checkDate), 1).getTime();
                    if (sortedDates[i] === prevDate) {
                        currentStreak++;
                        checkDate = prevDate;
                    } else {
                        break;
                    }
                }
            }
        }

        return { trendData, categoryData, currentStreak };
    }, [entries, categories]);

    return (
        <div className="space-y-10 animate-in fade-in duration-300">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold mb-2">Insights</h1>
                <p className="text-sm text-text-secondary">Productivity analytics over time</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <Card className="p-8 col-span-2 lg:col-span-1">
                    <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-6">Activity Trend</h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEAEA" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                                    minTickGap={40}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                                    width={30}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '6px', border: '1px solid #EAEAEA', boxShadow: 'none' }}
                                    cursor={{ stroke: '#EAEAEA' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="activities"
                                    stroke="#000000"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4, fill: 'white', stroke: 'black', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-8 col-span-2 lg:col-span-1">
                    <h3 className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-6">Time by Category (Minutes)</h3>
                    {data.categoryData.length > 0 ? (
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.categoryData} layout="vertical" margin={{ left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#EAEAEA" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        width={70}
                                        tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                                    />
                                    <Tooltip cursor={{ fill: '#FAFAFA' }} contentStyle={{ borderRadius: '6px', border: '1px solid #EAEAEA' }} />
                                    <Bar dataKey="value" barSize={24} radius={[0, 4, 4, 0]}>
                                        {data.categoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1F2937' : '#9CA3AF'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-gray-300 text-sm">
                            No data available
                        </div>
                    )}
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard label="Current Streak" value={`${data.currentStreak} Days`} />
                {/* Placeholder stats for layout completeness */}
                <StatsCard label="Most Productive" value={data.categoryData[0]?.name || "N/A"} />
                <StatsCard label="Total Categories" value={data.categoryData.length.toString()} />
            </div>
        </div>
    );
}

function StatsCard({ label, value }: { label: string, value: string }) {
    return (
        <Card className="p-6">
            <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">{label}</p>
            <p className="text-xl font-semibold text-text-primary">{value}</p>
        </Card>
    );
}
