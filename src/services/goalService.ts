import { supabase } from '../lib/supabase';
import type { Goal, Entry } from '../types';

export async function createGoal(userId: string, goalData: Partial<Goal>): Promise<Goal> {
    const { data, error } = await supabase
        .from('goals')
        .insert({
            user_id: userId,
            title: goalData.title,
            description: goalData.description,
            category_id: goalData.category_id,
            target_type: goalData.target_type,
            target_value: goalData.target_value,
            time_period: goalData.time_period,
            keywords: goalData.keywords,
            end_date: goalData.end_date
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getUserGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
        .from('goals')
        .select('*, categories(name, color)') // Optionally join categories if needed for UI, but types might need adjustment
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteGoal(goalId: string): Promise<void> {
    const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

    if (error) throw error;
}

// AI Matching Logic
async function aiCheckGoalMatch(entry: Entry, goal: Goal): Promise<boolean> {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o', // Using 4o for better reasoning on semantic matches
                messages: [
                    {
                        role: 'system',
                        content: 'You are a goal matching assistant. Determine if an activity matches a user\'s goal. Answer only "yes" or "no".'
                    },
                    {
                        role: 'user',
                        content: `Does this activity match the goal?
Activity: "${entry.activity}"
Goal: "${goal.title}"
Goal description: "${goal.description || 'None'}"

Answer with only "yes" or "no".`
                    }
                ],
                temperature: 0.2,
                max_tokens: 10
            })
        });

        const data = await response.json();
        const answer = data.choices[0].message.content.toLowerCase().trim();
        return answer.includes('yes');
    } catch (e) {
        console.error("AI Goal Match failed", e);
        return false;
    }
}

export async function checkGoalMatches(userId: string, entry: Entry): Promise<Goal[]> {
    // 1. Fetch active goals
    const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

    if (!goals || goals.length === 0) return [];

    const completedGoals: Goal[] = [];

    for (const goal of goals) {
        let matches = false;

        // Check 1: Category match
        if (goal.category_id && entry.category_id === goal.category_id) {
            matches = true;
        }

        // Check 2: Keyword match
        if (!matches && goal.keywords && goal.keywords.length > 0) {
            const entryText = entry.activity.toLowerCase();
            const hasKeyword = goal.keywords.some((keyword: string) =>
                entryText.includes(keyword.toLowerCase().trim())
            );
            if (hasKeyword) {
                matches = true;
            }
        }

        // Check 3: AI Fallback
        // Only verify with AI if no keywords defined and category didn't match (or wasn't defined)
        // If keywords ARE defined, we assume strict keyword matching unless category matched.
        // If category IS defined, we expect category match. 
        // So actually, AI is best for "Loose" goals without specific category/keywords or if user explicitly wants smart matching (maybe we need a flag? for now assume if no keywords/category)
        if (!matches && !goal.category_id && (!goal.keywords || goal.keywords.length === 0)) {
            matches = await aiCheckGoalMatch(entry, goal);
        }

        if (matches) {
            const completed = await updateGoalProgress(goal, entry);
            if (completed) {
                completedGoals.push(completed);
            }
        }
    }

    return completedGoals;
}

// Calculate Period Progress (helper to verify if we just rely on current_value from DB or recalculate)
// For simplicity, we trust current_value + add new value, but periodic resets handle the "new period" logic.
async function updateGoalProgress(goal: Goal, entry: Entry) {
    let valueToAdd = 0;

    if (goal.target_type === 'time') {
        valueToAdd = entry.duration_minutes || 0;
    } else {
        valueToAdd = 1;
    }

    if (valueToAdd === 0) return;

    // We assume current_value is up to date for the current period due to checkAndResetGoalPeriods running on load
    const newValue = (goal.current_value || 0) + valueToAdd;

    // Update Goal
    await supabase.from('goals').update({
        current_value: newValue,
        updated_at: new Date().toISOString()
    }).eq('id', goal.id);

    // Record Progress
    await supabase.from('goal_progress').insert({
        goal_id: goal.id,
        entry_id: entry.id,
        value_added: valueToAdd
    });

    // Check Completion
    if (newValue >= goal.target_value && goal.status !== 'completed') {
        const { data: updatedGoal } = await supabase
            .from('goals')
            .update({ status: 'completed' })
            .eq('id', goal.id)
            .select()
            .single();
        return updatedGoal; // Return the full goal object if completed
    }
    return null;
}

export async function checkAndResetGoalPeriods(userId: string) {
    const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

    if (!goals) return;

    const now = new Date();

    for (const goal of goals) {
        const lastUpdated = new Date(goal.updated_at);
        let shouldReset = false;

        // Simple reset logic based on date comparison
        if (goal.time_period === 'daily') {
            shouldReset = lastUpdated.toDateString() !== now.toDateString();
        } else if (goal.time_period === 'weekly') {
            // Check if lastUpdated was in a previous week (Monday start)
            const getWeekStart = (d: Date) => {
                const date = new Date(d);
                const day = date.getDay(); // 0 (Sun) to 6 (Sat)
                const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                return new Date(date.setDate(diff)).setHours(0, 0, 0, 0);
            };

            if (getWeekStart(lastUpdated) !== getWeekStart(now)) {
                shouldReset = true;
            }
        } else if (goal.time_period === 'monthly') {
            shouldReset = lastUpdated.getMonth() !== now.getMonth() || lastUpdated.getFullYear() !== now.getFullYear();
        }

        if (shouldReset) {
            await supabase.from('goals').update({
                current_value: 0,
                status: 'active', // Reactivate if it was 'completed' last period? 
                // Actually, 'completed' status might persist until reset. 
                // User might want to see 'Completed' label for the rest of the day/week.
                // So yes, reset implies back to 'active' for new cycle.
                updated_at: new Date().toISOString()
            }).eq('id', goal.id);
        }
    }
}
