export interface Category {
    id: string;
    name: string;
    color: string;
    user_id: string;
}

export interface Profile {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
}

export interface Entry {
    id: string;
    text: string;
    activity: string;
    category_id: string;
    duration_minutes: number | null;
    sentiment: 'positive' | 'neutral' | 'negative' | null;
    user_id: string;
    timestamp: string; // ISO string from DB
    created_at?: string;
}

// Keeping ParsedData for UI compatibility with AI service
export interface ParsedData {
    activity: string;
    category?: string; // Optional now, determined by matcher
    duration_minutes: number | null;
    sentiment: 'positive' | 'neutral' | 'negative';
}

export interface PendingCategory {
    id: string;
    suggested_name: string;
    entry_id: string;
    reason: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export interface CategoryMatchResult {
    matches: boolean;
    category_name?: string;
    suggested_category?: string;
    confidence: number;
    reasoning: string;
}

export interface WeeklySummary {
    id: string;
    user_id: string;
    week_start: string;
    week_end: string;
    total_minutes: number;
    total_entries: number;
    active_days: number;
    top_category: string | null;
    ai_summary: string | null;
    stats: any;
    created_at: string;
}

export type GoalTargetType = 'time' | 'count';
export type GoalTimePeriod = 'daily' | 'weekly' | 'monthly';
export type GoalStatus = 'active' | 'completed' | 'paused';

export interface Goal {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    category_id: string | null;
    target_type: GoalTargetType;
    target_value: number;
    current_value: number;
    time_period: GoalTimePeriod;
    status: GoalStatus;
    keywords: string[] | null;
    start_date: string;
    end_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface GoalProgress {
    id: string;
    goal_id: string;
    entry_id: string;
    value_added: number;
    recorded_at: string;
}
