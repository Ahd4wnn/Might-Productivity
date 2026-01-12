import { useState } from 'react';
import { X, Target } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { Button } from './ui/Button';
import type { GoalTargetType, GoalTimePeriod } from '../types';

interface CreateGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateGoalModal({ isOpen, onClose }: CreateGoalModalProps) {
    const { categories, addGoal } = useStore();
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [targetType, setTargetType] = useState<GoalTargetType>('time');
    const [targetValue, setTargetValue] = useState(60); // Default 1 hour
    const [timePeriod, setTimePeriod] = useState<GoalTimePeriod>('weekly');
    const [keywords, setKeywords] = useState(''); // Comma separated

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addGoal({
                title,
                description,
                category_id: categoryId || null,
                target_type: targetType,
                target_value: targetValue,
                time_period: timePeriod,
                keywords: keywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
            });
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setKeywords('');
        } catch (error) {
            console.error(error);
            alert("Failed to create goal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-600" />
                        Create New Goal
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Read 5 hours a week"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Type</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                value={targetType}
                                onChange={(e) => setTargetType(e.target.value as GoalTargetType)}
                            >
                                <option value="time">Time (Minutes)</option>
                                <option value="count">Count (Times)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                value={timePeriod}
                                onChange={(e) => setTimePeriod(e.target.value as GoalTimePeriod)}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Target Value {targetType === 'time' ? '(Minutes)' : '(Count)'}
                        </label>
                        <input
                            type="number"
                            required
                            min="1"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                            value={targetValue}
                            onChange={(e) => setTargetValue(parseInt(e.target.value))}
                        />
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Matching Criteria</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category (Optional)</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                >
                                    <option value="">Any Category</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Keywords (Optional)
                                    <span className="text-gray-400 font-normal ml-1">- Comma separated</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="gym, run, workout"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-1">If blank, AI will try to match based on title.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Goal'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
