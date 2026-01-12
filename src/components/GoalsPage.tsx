import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Plus, Target, CheckCircle2, PauseCircle, Trash2, PlayCircle } from 'lucide-react';
import { CreateGoalModal } from './CreateGoalModal';
import type { Goal } from '../types';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

export function GoalsPage() {
    const { goals, removeGoal, editGoal, categories } = useStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const pausedGoals = goals.filter(g => g.status === 'paused');

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold mb-2">Goals</h1>
                    <p className="text-sm text-text-secondary">Track your habits and achievements.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Goal
                </Button>
            </div>

            <CreateGoalModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

            {goals.length === 0 && (
                <div className="border border-dashed border-gray-200 rounded-xl p-12 text-center">
                    <Target className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h3>
                    <p className="text-text-tertiary mb-6">Create your first goal to start tracking progress.</p>
                    <Button variant="secondary" onClick={() => setIsCreateOpen(true)}>Create Goal</Button>
                </div>
            )}

            {activeGoals.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        Active
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {activeGoals.map(goal => (
                            <GoalCard key={goal.id} goal={goal} categories={categories} onRemove={removeGoal} onEdit={editGoal} />
                        ))}
                    </div>
                </section>
            )}

            {pausedGoals.length > 0 && (
                <section className="space-y-4 pt-4">
                    <h2 className="text-lg font-medium text-text-secondary flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        Paused
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 opacity-75">
                        {pausedGoals.map(goal => (
                            <GoalCard key={goal.id} goal={goal} categories={categories} onRemove={removeGoal} onEdit={editGoal} />
                        ))}
                    </div>
                </section>
            )}

            {completedGoals.length > 0 && (
                <section className="space-y-4 pt-4">
                    <h2 className="text-lg font-medium text-text-secondary flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Completed
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {completedGoals.map(goal => (
                            <GoalCard key={goal.id} goal={goal} categories={categories} onRemove={removeGoal} onEdit={editGoal} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function GoalCard({ goal, categories, onRemove, onEdit }: { goal: Goal; categories: any[], onRemove: (id: string) => void, onEdit: (id: string, updates: Partial<Goal>) => void }) {
    const category = categories.find(c => c.id === goal.category_id);
    const percentage = Math.min(Math.round((goal.current_value / goal.target_value) * 100), 100);
    const isCompleted = goal.status === 'completed';

    const togglePause = () => {
        onEdit(goal.id, { status: goal.status === 'active' ? 'paused' : 'active' });
    };

    return (
        <Card className="p-5 flex flex-col justify-between h-full group transition-all hover:shadow-md border border-gray-100 hover:border-gray-200">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2 items-start">
                        {isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" /> : <Target className="w-5 h-5 text-indigo-500 mt-0.5" />}
                        <div>
                            <h3 className={cn("font-medium text-gray-900", isCompleted && "line-through text-gray-500")}>{goal.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide px-1.5 py-0.5 bg-gray-50 rounded border border-gray-100">
                                    {goal.time_period}
                                </span>
                                {category && (
                                    <Badge variant="outline" className="text-[10px]" style={{ color: category.color, borderColor: category.color + '40', backgroundColor: category.color + '10' }}>
                                        {category.name}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {goal.status !== 'completed' && (
                            <button onClick={togglePause} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600" title={goal.status === 'paused' ? "Resume" : "Pause"}>
                                {goal.status === 'paused' ? <PlayCircle className="w-4 h-4 gap-2" /> : <PauseCircle className="w-4 h-4 gap-2" />}
                            </button>
                        )}
                        <button onClick={() => onRemove(goal.id)} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500" title="Delete">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <div className="flex justify-between text-xs text-text-secondary mb-1.5">
                    <span>{goal.current_value} / {goal.target_value} {goal.target_type === 'time' ? 'mins' : 'times'}</span>
                    <span className="font-medium">{percentage}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={cn("h-full rounded-full transition-all duration-500",
                            isCompleted ? "bg-green-500" :
                                goal.status === 'paused' ? "bg-yellow-400" : "bg-indigo-500"
                        )}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </Card>
    );
}
