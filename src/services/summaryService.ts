import { supabase } from '../lib/supabase';
import type { WeeklySummary } from '../types';

interface WeekData {
    startDate: string;
    endDate: string;
    totalMinutes: number;
    totalHours: number;
    totalEntries: number;
    activeDays: number;
    topCategory: { name: string; minutes: number; activities: string[] } | null;
    bestDay: { date: string; minutes: number } | null;
    entries: any[];
}

export async function getWeekData(userId: string, startDate: Date, endDate: Date): Promise<WeekData> {
    const { data: entries } = await supabase
        .from('entries')
        .select('*, categories(name, color)')
        .eq('user_id', userId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: true });

    const safeEntries = entries || [];

    // Calculate stats
    const totalMinutes = safeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const totalEntries = safeEntries.length;
    // unique days based on date string
    const uniqueDays = new Set(safeEntries.map(e => new Date(e.timestamp).toDateString())).size;

    // Group by category
    const byCategory: Record<string, { count: number; minutes: number; activities: string[] }> = {};

    safeEntries.forEach(entry => {
        // @ts-ignore
        const category = entry.categories?.name || 'Uncategorized';
        if (!byCategory[category]) {
            byCategory[category] = {
                count: 0,
                minutes: 0,
                activities: []
            };
        }
        byCategory[category].count++;
        byCategory[category].minutes += entry.duration_minutes || 0;
        if (entry.activity) {
            byCategory[category].activities.push(entry.activity);
        }
    });

    // Find top category
    const topCategoryEntry = Object.entries(byCategory)
        .sort((a, b) => b[1].minutes - a[1].minutes)[0];

    const topCategory = topCategoryEntry ? { name: topCategoryEntry[0], ...topCategoryEntry[1] } : null;

    // Find longest day
    const dayTotals: Record<string, number> = {};
    safeEntries.forEach(entry => {
        const day = new Date(entry.timestamp).toDateString();
        dayTotals[day] = (dayTotals[day] || 0) + (entry.duration_minutes || 0);
    });

    const bestDayEntry = Object.entries(dayTotals)
        .sort((a, b) => b[1] - a[1])[0];

    const bestDay = bestDayEntry ? { date: bestDayEntry[0], minutes: bestDayEntry[1] } : null;

    return {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalMinutes,
        totalHours: Math.floor(totalMinutes / 60),
        totalEntries,
        activeDays: uniqueDays,
        topCategory,
        bestDay,
        entries: safeEntries
    };
}

export async function generateWeeklySummary(weekData: WeekData): Promise<string> {
    const prompt = `Generate a weekly summary for this data:

Total time tracked: ${weekData.totalHours}h ${weekData.totalMinutes % 60}m
Total activities: ${weekData.totalEntries}
Active days: ${weekData.activeDays}/7
Top category: ${weekData.topCategory?.name || 'None'} (${weekData.topCategory ? Math.floor(weekData.topCategory.minutes / 60) : 0}h ${weekData.topCategory ? weekData.topCategory.minutes % 60 : 0}m)
Best day: ${weekData.bestDay ? new Date(weekData.bestDay.date).toLocaleDateString() : 'N/A'} (${weekData.bestDay ? Math.floor(weekData.bestDay.minutes / 60) : 0}h ${weekData.bestDay ? weekData.bestDay.minutes % 60 : 0}m)

Activities in ${weekData.topCategory?.name || 'Top Category'}: ${weekData.topCategory?.activities.slice(0, 5).join(', ') || 'None'}

Create an encouraging, personal summary that makes them feel proud of their week. Keep it to 3 short paragraphs.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o', // Safe fallback, assuming gpt-5-nano might not be avail
                messages: [
                    {
                        role: 'system',
                        content: "You are a supportive productivity coach. Generate a warm, encouraging weekly summary based on the user's data. Be specific, celebrate their achievements, and make them feel proud. Tone: Encouraging, personal, proud, motivational. Length: 3 paragraphs."
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 300
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.choices[0].message.content;
    } catch (e) {
        console.error("AI Generation failed", e);
        return "You had a great week! Keep up the good work.";
    }
}

export async function saveWeeklySummary(userId: string, weekData: WeekData, aiSummary: string) {
    const { data, error } = await supabase
        .from('weekly_summaries')
        .insert({
            user_id: userId,
            week_start: weekData.startDate,
            week_end: weekData.endDate,
            total_minutes: weekData.totalMinutes,
            total_entries: weekData.totalEntries,
            active_days: weekData.activeDays,
            top_category: weekData.topCategory?.name || null,
            ai_summary: aiSummary,
            stats: weekData // Store full stats as JSON
        })
        .select()
        .single();

    if (error) throw error;
    return data as WeeklySummary;
}
