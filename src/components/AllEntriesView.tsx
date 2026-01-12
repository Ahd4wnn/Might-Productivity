import { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { format } from 'date-fns';
import { Search, ArrowUpDown, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';

export function AllEntriesView() {
    const { entries, categories, deleteEntry } = useStore();
    const [search, setSearch] = useState('');
    const [filterCategoryId, setFilterCategoryId] = useState<string | 'All'>('All');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    const getCategoryName = (catId: string) => {
        return categories.find(c => c.id === catId)?.name || 'Other';
    }

    const filteredEntries = useMemo(() => {
        let result = entries;

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(e =>
                e.text.toLowerCase().includes(q) ||
                e.activity.toLowerCase().includes(q)
            );
        }

        if (filterCategoryId !== 'All') {
            result = result.filter(e => e.category_id === filterCategoryId);
        }

        result.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
        });

        return result;
    }, [entries, search, filterCategoryId, sortOrder]);

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-semibold">All Entries</h1>
                <div className="flex gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <Input
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                    <select
                        value={filterCategoryId}
                        onChange={e => setFilterCategoryId(e.target.value as any)}
                        className="h-9 rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    >
                        <option value="All">All Categories</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                    <Button
                        variant="secondary"
                        onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                        className="h-9"
                    >
                        <ArrowUpDown className="w-3.5 h-3.5 mr-2" />
                        {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                    </Button>
                </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-border">
                        <tr>
                            <th className="px-6 py-3 font-medium text-text-tertiary w-32">Date</th>
                            <th className="px-6 py-3 font-medium text-text-tertiary">Activity</th>
                            <th className="px-6 py-3 font-medium text-text-tertiary w-32">Category</th>
                            <th className="px-6 py-3 font-medium text-text-tertiary w-24 text-right">Time</th>
                            <th className="px-6 py-3 font-medium text-text-tertiary w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-border">
                        {filteredEntries.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-text-tertiary">
                                    No entries found.
                                </td>
                            </tr>
                        ) : (
                            filteredEntries.map(entry => (
                                <tr key={entry.id} className="group hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-text-secondary whitespace-nowrap">
                                        {format(new Date(entry.timestamp), 'MMM d, p')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-gray-900 group-hover:text-black transition-colors">{entry.activity}</p>
                                        <div className="text-xs text-text-tertiary font-normal truncate max-w-[300px] mt-0.5">
                                            {entry.text}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge>{getCategoryName(entry.category_id)}</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right text-text-secondary">
                                        {entry.duration_minutes ? `${entry.duration_minutes}m` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Delete entry?')) deleteEntry(entry.id);
                                            }}
                                            className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
