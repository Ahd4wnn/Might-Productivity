import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

export function ForgotPasswordPage() {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            setMessage('');
            setError('');
            setLoading(true);
            const { error } = await resetPassword(email);
            if (error) throw error;
            setMessage('Check your email for password reset instructions');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold tracking-tight">Reset Password</h2>
                    <p className="text-sm text-gray-500 mt-2">Enter your email to receive reset instructions</p>
                </div>

                <Card className="p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                                {error}
                            </div>
                        )}
                        {message && (
                            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-100">
                                {message}
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
                        </div>

                        <Button type="submit" className="w-full" isLoading={loading}>
                            Send Reset Link
                        </Button>
                    </form>
                </Card>

                <p className="text-center text-sm text-gray-500">
                    <Link to="/login" className="font-medium text-black hover:underline">
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
