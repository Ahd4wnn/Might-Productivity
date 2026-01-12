import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { matchCategory } from '../services/openai';
import type { Entry, Category, ParsedData, Profile, PendingCategory, CategoryMatchResult, WeeklySummary, Goal } from '../types';
import { getWeekData, generateWeeklySummary, saveWeeklySummary } from '../services/summaryService';
import { createGoal, deleteGoal, getUserGoals, updateGoal, checkGoalMatches, checkAndResetGoalPeriods } from '../services/goalService';

const GUEST_STORAGE_KEY = 'might_guest_data';

// Default categories for guests
const DEFAULT_GUEST_CATEGORIES: Category[] = [
    { id: '1', name: 'Fitness', color: '#007AFF', user_id: 'guest' },
    { id: '2', name: 'Learning', color: '#AF52DE', user_id: 'guest' },
    { id: '3', name: 'Reading', color: '#FF9500', user_id: 'guest' },
    { id: '4', name: 'Work', color: '#6B7280', user_id: 'guest' },
    { id: '5', name: 'Health', color: '#FF3B30', user_id: 'guest' },
    { id: '6', name: 'Hobbies', color: '#34C759', user_id: 'guest' },
    { id: '7', name: 'Social', color: '#FF2D55', user_id: 'guest' },
    { id: '8', name: 'Other', color: '#5AC8FA', user_id: 'guest' }
];

interface StoreContextType {
    entries: Entry[];
    categories: Category[];
    pendingCategories: PendingCategory[];
    summaries: WeeklySummary[];
    latestSummary: WeeklySummary | null;
    clearLatestSummary: () => void;
    profile: Profile | null;
    loading: boolean;
    addEntry: (data: { text: string; parsedData: ParsedData }) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
    clearData: () => Promise<void>;
    approveCategory: (pendingId: string, name: string) => Promise<void>;
    rejectCategory: (pendingId: string, existingCategoryId?: string) => Promise<void>;
    createCategory: (name: string, color?: string) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    goals: Goal[];
    addGoal: (data: Partial<Goal>) => Promise<void>;
    editGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
    removeGoal: (id: string) => Promise<void>;
    newlyCompletedGoal: Goal | null;
    clearCompletedGoal: () => void;
    preferences: {
        showSuggestions: boolean;
        setShowSuggestions: (show: boolean) => void;
    };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
    const { user, isGuest } = useAuth();
    const [entries, setEntries] = useState<Entry[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [pendingCategories, setPendingCategories] = useState<PendingCategory[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [newlyCompletedGoal, setNewlyCompletedGoal] = useState<Goal | null>(null);
    const [summaries, setSummaries] = useState<WeeklySummary[]>([]);
    const [latestSummary, setLatestSummary] = useState<WeeklySummary | null>(null);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(() => {
        const saved = localStorage.getItem('might_settings_show_suggestions');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('might_settings_show_suggestions', JSON.stringify(showSuggestions));
    }, [showSuggestions]);

    // Check for weekly summary
    useEffect(() => {
        if (!user || isGuest) return;

        const checkSummary = async () => {
            const today = new Date();
            const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon

            // Only check on Monday (1) or Sunday (0)
            // Let's run it on Monday to capture full previous week (Mon-Sun)
            if (dayOfWeek !== 1) return;

            const lastWeekEnd = new Date(today);
            lastWeekEnd.setDate(today.getDate() - 1); // Sunday
            lastWeekEnd.setHours(23, 59, 59, 999);

            const lastWeekStart = new Date(lastWeekEnd);
            lastWeekStart.setDate(lastWeekEnd.getDate() - 6); // Previous Monday
            lastWeekStart.setHours(0, 0, 0, 0);

            // Check if we already have it locally first to save DB call
            // But state might be empty on reload, so check DB
            const { data: existing } = await supabase
                .from('weekly_summaries')
                .select('*')
                .eq('user_id', user.id)
                .eq('week_start', lastWeekStart.toISOString()) // Exact match might be tricky with ISO strings, date type in DB is 'date'
                // Let's rely on date part filtering if possible or just fetch all summaries and check in JS for now if list is small
                // Better: query by range overlap
                .gte('week_start', lastWeekStart.toISOString().split('T')[0])
                .lte('week_start', lastWeekStart.toISOString().split('T')[0])
                .single();

            if (existing) {
                // We have it, maybe it's new? We want to show modal if they haven't seen it. 
                // We'll handle "seen" state locally or just show it if it was created very recently (e.g. today)
                // For now, let's just generate if missing.
                return;
            }

            // Generate
            const weekData = await getWeekData(user.id, lastWeekStart, lastWeekEnd);
            if (weekData.totalEntries < 5) return; // Don't annoy inactive users

            const aiText = await generateWeeklySummary(weekData);
            const savedSummary = await saveWeeklySummary(user.id, weekData, aiText);

            setSummaries(prev => [savedSummary, ...prev]);
            setLatestSummary(savedSummary); // Triggers Modal
        };

        checkSummary();
    }, [user, isGuest]);

    // Fetch initial data
    useEffect(() => {
        if (!user && !isGuest) {
            setEntries([]);
            setCategories([]);
            setPendingCategories([]);
            setSummaries([]);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                if (isGuest) {
                    // ... guest logic ...
                    const localData = localStorage.getItem(GUEST_STORAGE_KEY);
                    if (localData) {
                        const parsed = JSON.parse(localData);
                        setEntries(parsed.entries || []);
                    }
                    setCategories(DEFAULT_GUEST_CATEGORIES);
                    setPendingCategories([]);
                    setProfile({ id: 'guest', username: 'Guest', full_name: 'Guest User', avatar_url: null });
                } else if (user) {
                    // ... existing user fetches ...
                    const { data: cats } = await supabase.from('categories').select('*');
                    setCategories(cats || []);

                    const { data: ents } = await supabase.from('entries').select('*').order('timestamp', { ascending: false });
                    setEntries(ents || []);

                    // Fetch and Reset Goals
                    await checkAndResetGoalPeriods(user.id);
                    const userGoals = await getUserGoals(user.id);
                    setGoals(userGoals); // already sorted in service

                    const { data: pend } = await supabase.from('pending_categories').select('*').eq('status', 'pending');
                    setPendingCategories(pend || []);

                    const { data: sums } = await supabase.from('weekly_summaries').select('*').order('week_start', { ascending: false });
                    setSummaries(sums || []);

                    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                    if (prof) {
                        setProfile(prof);
                    } else {
                        setProfile({ id: user.id, username: user.email?.split('@')[0] || 'User', full_name: null, avatar_url: null });
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, isGuest]);

    // Sync Guest Data
    useEffect(() => {
        if (isGuest) {
            localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ entries }));
        }
    }, [entries, isGuest]);

    const addEntry = useCallback(async (data: { text: string; parsedData: ParsedData }) => {
        try {
            let categoryId: string | null = null;
            let pendingSuggestion: CategoryMatchResult | null = null;

            // 1. Determine Category
            if (isGuest) {
                // Simple logic for guests (fallback to Other if not found)
                const catName = data.parsedData.category || 'Other';
                const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase()) || categories.find(c => c.name === 'Other');
                categoryId = cat ? cat.id : DEFAULT_GUEST_CATEGORIES[7].id;
            } else {
                // AI MATCHING for Users
                const match = await matchCategory(data.parsedData.activity, categories);

                if (match.matches && match.category_name) {
                    const existing = categories.find(c => c.name === match.category_name);
                    if (existing) categoryId = existing.id;
                } else {
                    // Suggestion Logic
                    pendingSuggestion = match;
                }
            }

            // 2. Insert Entry
            const newEntryBase = {
                text: data.text,
                activity: data.parsedData.activity,
                category_id: categoryId, // Can be null if pending
                duration_minutes: data.parsedData.duration_minutes,
                sentiment: data.parsedData.sentiment,
                timestamp: new Date().toISOString(),
            };

            if (isGuest) {
                const newEntry = { ...newEntryBase, id: crypto.randomUUID(), user_id: 'guest', category_id: categoryId! };
                setEntries(prev => [newEntry, ...prev]);
            } else if (user) {
                const { data: insertedEntry, error: entryError } = await supabase
                    .from('entries')
                    .insert({ ...newEntryBase, user_id: user.id })
                    .select()
                    .single();

                if (entryError) throw entryError;
                setEntries(prev => [insertedEntry, ...prev]);

                // 3. Handle Pending Category
                if (pendingSuggestion && insertedEntry) {
                    const { data: pending, error: pendingError } = await supabase
                        .from('pending_categories')
                        .insert({
                            suggested_name: pendingSuggestion.suggested_category || 'New Category',
                            entry_id: insertedEntry.id,
                            reason: pendingSuggestion.reasoning,
                            user_id: user.id,
                            status: 'pending'
                        })
                        .select()
                        .single();

                    if (pendingError) console.error("Failed to save suggestion", pendingError);
                    if (pending) setPendingCategories(prev => [...prev, pending]);
                }

                // 4. Check Goal Matches
                if (insertedEntry) {
                    const completedGoals = await checkGoalMatches(user.id, insertedEntry);

                    if (completedGoals.length > 0) {
                        setNewlyCompletedGoal(completedGoals[0]); // Show the first one completed
                        // If multiple, maybe queue them? For now simple one is fine.
                    }

                    // Refresh goals to show updated progress
                    const updatedGoals = await getUserGoals(user.id);
                    setGoals(updatedGoals);
                }
            }
        } catch (error) {
            console.error('Error adding entry:', error);
            alert('Failed to save entry');
        }
    }, [user, isGuest, categories]);

    const approveCategory = useCallback(async (pendingId: string, name: string) => {
        if (!user) return;
        try {
            const pending = pendingCategories.find(p => p.id === pendingId);
            if (!pending) return;

            // 1. Create new category
            const { data: newCat, error: catError } = await supabase
                .from('categories')
                .insert({ name, user_id: user.id, color: '#6B7280' }) // Default color
                .select()
                .single();

            if (catError) throw catError;
            setCategories(prev => [...prev, newCat]);

            // 2. Update Entry
            await supabase.from('entries').update({ category_id: newCat.id }).eq('id', pending.entry_id);
            setEntries(prev => prev.map(e => e.id === pending.entry_id ? { ...e, category_id: newCat.id } : e));

            // 3. Update Pending Status
            await supabase.from('pending_categories').delete().eq('id', pendingId);
            setPendingCategories(prev => prev.filter(p => p.id !== pendingId));

        } catch (e) {
            console.error("Approve failed", e);
            alert("Failed to create category");
        }
    }, [user, pendingCategories]);

    const rejectCategory = useCallback(async (pendingId: string, existingCategoryId?: string) => {
        if (!user) return;
        try {
            const pending = pendingCategories.find(p => p.id === pendingId);
            if (!pending) return;

            if (existingCategoryId) {
                await supabase.from('entries').update({ category_id: existingCategoryId }).eq('id', pending.entry_id);
                setEntries(prev => prev.map(e => e.id === pending.entry_id ? { ...e, category_id: existingCategoryId } : e));
            }

            await supabase.from('pending_categories').delete().eq('id', pendingId);
            setPendingCategories(prev => prev.filter(p => p.id !== pendingId));
        } catch (e) {
            console.error("Reject failed", e);
        }
    }, [user, pendingCategories]);

    const createCategory = useCallback(async (name: string, color: string = '#6B7280') => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('categories')
                .insert({ name, color, user_id: user.id })
                .select()
                .single();
            if (error) throw error;
            setCategories(prev => [...prev, data]);
        } catch (e) {
            console.error("Create cat failed", e);
            throw e;
        }
    }, [user]);

    const deleteCategory = useCallback(async (id: string) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);
            if (error) throw error;
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (e) {
            console.error("Delete cat failed", e);
            throw e;
        }
    }, [user]);

    const deleteEntry = useCallback(async (id: string) => {
        try {
            if (isGuest) {
                setEntries(prev => prev.filter(e => e.id !== id));
            } else if (user) {
                await supabase.from('entries').delete().eq('id', id);
                setEntries(prev => prev.filter(e => e.id !== id));
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    }, [user, isGuest]);

    const updateProfile = useCallback(async (updates: Partial<Profile>) => {
        if (isGuest || !user) return;
        try {
            // STRICT UPSERT VERIFICATION
            const { data, error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .select() // REQUEST RETURNED DATA
                .single();

            if (error) throw error;
            if (!data) throw new Error("Database update succeeded but returned no data. Check RLS 'select' policies.");

            // Only update local state if DB verified
            setProfile(data);
        } catch (err) {
            console.error('Error updating profile:', err);
            throw err; // Propagate to UI
        }
    }, [user, isGuest]);

    const clearData = useCallback(async () => {
        if (isGuest) {
            setEntries([]);
            localStorage.removeItem(GUEST_STORAGE_KEY);
        }
    }, [isGuest]);

    const addGoal = useCallback(async (data: Partial<Goal>) => {
        if (!user) return;
        try {
            const newGoal = await createGoal(user.id, data);
            setGoals(prev => [newGoal, ...prev]);
        } catch (e) {
            console.error("Failed to create goal", e);
            throw e;
        }
    }, [user]);

    const editGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
        if (!user) return;
        try {
            const updated = await updateGoal(id, updates);
            setGoals(prev => prev.map(g => g.id === id ? updated : g));
        } catch (e) {
            console.error("Failed to update goal", e);
            throw e;
        }
    }, [user]);

    const removeGoal = useCallback(async (id: string) => {
        if (!user) return;
        try {
            await deleteGoal(id);
            setGoals(prev => prev.filter(g => g.id !== id));
        } catch (e) {
            console.error("Failed to delete goal", e);
            throw e;
        }
    }, [user]);

    const value = {
        entries,
        categories,
        pendingCategories,
        goals,
        addGoal,
        editGoal,
        removeGoal,
        summaries,
        latestSummary,
        clearLatestSummary: () => setLatestSummary(null),
        newlyCompletedGoal,
        clearCompletedGoal: () => setNewlyCompletedGoal(null),
        profile,
        loading,
        addEntry,
        deleteEntry,
        updateProfile,
        clearData,
        approveCategory,
        rejectCategory,
        createCategory,
        deleteCategory,
        preferences: {
            showSuggestions,
            setShowSuggestions
        }
    };
    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
    const context = useContext(StoreContext);
    if (context === undefined) throw new Error('useStore must be used within a StoreProvider');
    return context;
}
