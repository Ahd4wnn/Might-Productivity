import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

export function LoginPage() {
    const { signIn, continueAsGuest } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error } = await signIn(email, password);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            navigate('/');
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="text-center">
                    <div className="mx-auto w-10 h-10 bg-black rounded-lg flex items-center justify-center mb-6">
                        <span className="text-white font-bold text-lg">M</span>
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
                    <p className="text-sm text-gray-500 mt-2">Enter your credentials to access your journal</p>
                </div>

                <Card className="p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <Input
                                label="Email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                            <div className="space-y-1">
                                <Input
                                    label="Password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                                <div className="flex justify-end">
                                    <Link to="/forgot-password" className="text-xs text-gray-500 hover:text-black">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" isLoading={loading}>
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => {
                                continueAsGuest();
                                navigate('/');
                            }}
                        >
                            Continue as Guest
                        </Button>
                    </div>
                </Card>

                <p className="text-center text-sm text-gray-500">
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-medium text-black hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
