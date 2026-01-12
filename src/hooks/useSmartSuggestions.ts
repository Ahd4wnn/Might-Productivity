import { useMemo } from 'react';
import type { Entry } from '../types';
import { subDays, isAfter } from 'date-fns';

export interface Suggestion {
    activity: string;
    categoryId: string | null;
    avgDuration: number;
    frequency: number;
}

const DEFAULT_SUGGESTIONS: Suggestion[] = [
    { activity: "Went to gym", categoryId: null, avgDuration: 60, frequency: 0 },
    { activity: "Read a book", categoryId: null, avgDuration: 30, frequency: 0 },
    { activity: "Worked on project", categoryId: null, avgDuration: 120, frequency: 0 },
    { activity: "Studied new skill", categoryId: null, avgDuration: 45, frequency: 0 },
    { activity: "Practiced meditation", categoryId: null, avgDuration: 15, frequency: 0 }
];

export function useSmartSuggestions(entries: Entry[]) {
    const suggestions = useMemo(() => {
        if (entries.length < 5) {
            return DEFAULT_SUGGESTIONS;
        }

        const thirtyDaysAgo = subDays(new Date(), 30);
        const recentEntries = entries.filter(e => isAfter(new Date(e.timestamp), thirtyDaysAgo));

        const activityMap = new Map<string, { count: number; totalDuration: number; categoryId: string | null }>();

        recentEntries.forEach(entry => {
            const activity = entry.activity.trim(); // Case sensitive or insensitive? Let's keep original casing but trim
            // Actually, best to normalize somewhat, but users might prefer their casing.
            // Let's use the exact string to avoid duplicates like "Gym" vs "gym" if possible, or normalize.
            // For simple "smartness", let's normalize to lowercase keys but keep display name.
            const key = activity.toLowerCase();

            const current = activityMap.get(key) || { count: 0, totalDuration: 0, categoryId: entry.category_id || null };

            activityMap.set(key, {
                count: current.count + 1,
                totalDuration: current.totalDuration + (entry.duration_minutes || 0),
                categoryId: entry.category_id || current.categoryId // Prefer last known category
            });
        });

        // Convert back to array
        const sorted = Array.from(activityMap.entries())
            .map(([key, data]) => ({
                activity: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize for display
                avgDuration: Math.round(data.totalDuration / data.count),
                frequency: data.count,
                categoryId: data.categoryId
            }))
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 8); // Top 8

        return sorted;

    }, [entries]);

    return suggestions;
}
