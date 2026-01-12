import React, { useState } from 'react';
import { parseEntryWithAI } from '../services/openai';
import { useStore } from '../hooks/useStore';
import { useSmartSuggestions } from '../hooks/useSmartSuggestions';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Trash2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

export function TodayView() {
    const { entries, categories, addEntry, deleteEntry, preferences } = useStore();
    const suggestions = useSmartSuggestions(entries);
    const [input, setInput] = useState('');
    const [isParsing, setIsParsing] = useState(false);

    const todayEntries = entries.filter(e => isSameDay(new Date(e.timestamp), new Date()));

    const getCategoryName = (catId: string) => {
        return categories.find(c => c.id === catId)?.name || 'Other';
    }

    const handleQuickAdd = async (suggestion: any) => {
        setIsParsing(true);
        await addEntry({
            text: suggestion.activity,
            parsedData: {
                activity: suggestion.activity,
                duration_minutes: suggestion.avgDuration,
                sentiment: 'neutral',
                category: categories.find(c => c.id === suggestion.categoryId)?.name
            }
        });
        setIsParsing(false);
    };

    const handleSubmit = async () => {
        if (!input.trim()) return;

        setIsParsing(true);
        const { parsed, error } = await parseEntryWithAI(input);
        setIsParsing(false);

        if (error) {
            alert(`Error: ${error}`);
            return;
        }

        addEntry({
            text: input,
            parsedData: parsed
        });
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
            <div className="mb-10">
                <h1 className="text-2xl font-semibold mb-2">Today</h1>
                <p className="text-sm text-text-secondary">{format(new Date(), 'MMMM d, yyyy')}</p>
            </div>

            <Card className="p-6 mb-8 border-border hover:border-gray-300 transition-colors shadow-none">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="What did you accomplish today?"
                        className="w-full resize-none bg-transparent text-[15px] placeholder:text-gray-400 focus:outline-none min-h-[80px]"
                        disabled={isParsing}
                        autoFocus
                    />
                    <div className="flex justify-end mt-4">
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={!input.trim() || isParsing}
                            isLoading={isParsing}
                        >
                            Log Entry
                        </Button>
                    </div>
                </div>
            </Card>

            {preferences.showSuggestions && (
                <div className="mb-8">
                    <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Quick Add</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => handleQuickAdd(suggestion)}
                                className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-text-secondary text-sm rounded-md border border-gray-200 transition-colors flex items-center gap-2"
                            >
                                <span>{suggestion.activity}</span>
                                <span className="text-[10px] text-gray-400 bg-gray-100 px-1 rounded">{suggestion.avgDuration}m</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-6">
                <h2 className="text-base font-semibold">Today's Entries</h2>

                <div className="space-y-2">
                    {todayEntries.length === 0 ? (
                        <div className="text-left py-8 text-text-tertiary text-sm">
                            No entries yet. Start logging!
                        </div>
                    ) : (
                        todayEntries.map((entry) => (
                            <Card
                                key={entry.id}
                                className="p-4 flex items-center justify-between group hover:border-gray-300 transition-colors"
                            >
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge>{getCategoryName(entry.category_id)}</Badge>
                                    <span className="text-xs text-text-tertiary">
                                        {entry.activity}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    {entry.duration_minutes && (
                                        <span className="text-xs text-text-tertiary">{entry.duration_minutes}m</span>
                                    )}
                                    <button
                                        onClick={() => deleteEntry(entry.id)}
                                        className="text-text-tertiary hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
