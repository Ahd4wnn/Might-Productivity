import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Trash2, Plus } from 'lucide-react';

export function CategoriesPage() {
    const { categories, entries, createCategory, deleteCategory } = useStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');

    const handleCreate = async () => {
        if (!newName.trim()) return;
        try {
            await createCategory(newName);
            setNewName('');
            setIsCreating(false);
        } catch (e: any) {
            alert("Error: " + e.message);
        }
    };

    const getEntryCount = (catId: string) => {
        return entries.filter(e => e.category_id === catId).length;
    };

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-2xl font-semibold mb-2">Categories</h1>
                    <p className="text-sm text-text-secondary">Manage your activity categories</p>
                </div>
                <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
                    <Plus className="w-4 h-4 mr-2" /> New Category
                </Button>
            </div>

            {isCreating && (
                <Card className="p-4 mb-6 border-blue-200 bg-blue-50/50">
                    <div className="flex gap-3">
                        <Input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Category Name"
                            className="bg-white"
                            autoFocus
                        />
                        <Button onClick={handleCreate}>Save</Button>
                        <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                    </div>
                </Card>
            )}

            <div className="grid gap-4">
                {categories.map((cat) => (
                    <Card key={cat.id} className="p-4 flex items-center justify-between group hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-4">
                            <span
                                className="w-3 h-3 rounded-full shadow-sm"
                                style={{ backgroundColor: cat.color }}
                            />
                            <span className="font-medium">{cat.name}</span>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-xs text-text-tertiary">
                                {getEntryCount(cat.id)} entries
                            </div>

                            {getEntryCount(cat.id) === 0 ? (
                                <button
                                    onClick={() => deleteCategory(cat.id)}
                                    className="text-text-tertiary hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            ) : (
                                <div className="w-4" /> // Spacing placeholder
                            )}
                        </div>
                    </Card>
                ))}

                {categories.length === 0 && (
                    <div className="text-center py-12 text-text-tertiary border-2 border-dashed border-gray-100 rounded-xl">
                        No categories found. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
