import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Check, X, Edit2, AlertCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export function CategoryNotification() {
    const { pendingCategories, approveCategory, rejectCategory, categories } = useStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedName, setEditedName] = useState('');
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    if (pendingCategories.length === 0) return null;

    const current = pendingCategories[0]; // Handle one at a time

    const handleApprove = async () => {
        await approveCategory(current.id, current.suggested_name);
    };

    const handleEditAndApprove = async () => {
        if (!editedName.trim()) return;
        await approveCategory(current.id, editedName);
        setEditingId(null);
    };

    const startReject = () => {
        setRejectingId(current.id);
    };

    const confirmReject = async (categoryId?: string) => {
        await rejectCategory(current.id, categoryId);
        setRejectingId(null);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white rounded-lg shadow-elevated border border-border p-5 w-[320px]">

                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-text-primary">New Category Suggested</h3>
                        <p className="text-xs text-text-secondary mt-1">
                            Based on your entry, should we create this category?
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="pl-11 space-y-3">
                    {editingId === current.id ? (
                        <div className="flex gap-2">
                            <Input
                                value={editedName}
                                onChange={e => setEditedName(e.target.value)}
                                className="h-8 text-sm"
                                autoFocus
                            />
                            <Button size="sm" onClick={handleEditAndApprove}>Save</Button>
                        </div>
                    ) : rejectingId === current.id ? (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-text-secondary">Assign existing category:</p>
                            <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto">
                                <button
                                    onClick={() => confirmReject(undefined)}
                                    className="text-xs border border-dashed border-gray-300 rounded px-2 py-1 hover:bg-gray-50"
                                >
                                    No Category
                                </button>
                                {categories.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => confirmReject(c.id)}
                                        className="text-xs border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 flex items-center gap-1"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-6 text-xs"
                                onClick={() => setRejectingId(null)}
                            >
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-3 rounded border border-border">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm">{current.suggested_name}</span>
                                <button onClick={() => { setEditingId(current.id); setEditedName(current.suggested_name); }} className="text-text-tertiary hover:text-text-primary">
                                    <Edit2 className="w-3 h-3" />
                                </button>
                            </div>
                            {current.reason && (
                                <p className="text-xs text-text-secondary italic">"{current.reason}"</p>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    {!editingId && !rejectingId && (
                        <div className="flex gap-2 pt-1">
                            <Button size="sm" className="flex-1" onClick={handleApprove}>
                                <Check className="w-3 h-3 mr-1.5" /> Accept
                            </Button>
                            <Button size="sm" variant="secondary" className="flex-1" onClick={startReject}>
                                <X className="w-3 h-3 mr-1.5" /> Reject
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
