import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Button } from './ui/Button';
import { Trophy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function GoalCompletionModal() {
    const { newlyCompletedGoal, clearCompletedGoal } = useStore();
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (newlyCompletedGoal) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 3000); // Stop confetti after 3s
            return () => clearTimeout(timer);
        }
    }, [newlyCompletedGoal]);

    if (!newlyCompletedGoal) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={clearCompletedGoal}
                />

                {/* Confetti Effect (CSS Based) */}
                {showConfetti && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ top: '50%', left: '50%', scale: 0 }}
                                animate={{
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                    rotate: Math.random() * 360,
                                    scale: Math.random() * 1 + 0.5,
                                    opacity: 0
                                }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="absolute w-3 h-3 rounded-full"
                                style={{
                                    backgroundColor: ['#FFD700', '#FF3B30', '#007AFF', '#34C759'][Math.floor(Math.random() * 4)]
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Card */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 20 }}
                    className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center overflow-hidden"
                >
                    {/* Background decoration */}
                    <div className="absolute -top-12 -left-12 w-32 h-32 bg-yellow-100 rounded-full blur-3xl opacity-50" />
                    <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50" />

                    <button
                        onClick={clearCompletedGoal}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="mb-6 relative">
                        <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-2 ring-4 ring-yellow-100">
                            <Trophy className="w-10 h-10 text-yellow-500" />
                        </div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm"
                        >
                            +100%
                        </motion.div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Goal Completed!</h2>
                    <p className="text-text-secondary mb-6">
                        You've reached your target for <br />
                        <span className="font-semibold text-text-primary px-2 py-0.5 bg-gray-100 rounded-md mt-1 inline-block">
                            {newlyCompletedGoal.title}
                        </span>
                    </p>

                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex justify-between text-sm text-text-secondary mb-1">
                                <span>Progress</span>
                                <span className="font-medium text-green-600">Done</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-green-500 rounded-full"
                                />
                            </div>
                        </div>

                        <Button onClick={clearCompletedGoal} className="w-full" size="lg">
                            Keep it up!
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
