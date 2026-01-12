import { useState, useEffect } from 'react';
import { X, Trash2, Download, ExternalLink, LogOut } from 'lucide-react';
import { Button } from './ui/Button';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { Input } from './ui/Input';
import { Link } from 'react-router-dom';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
    const { entries, profile, updateProfile, clearData, preferences } = useStore();
    const { user, signOut, isGuest } = useAuth();

    const [newPassword, setNewPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');

    const [username, setUsername] = useState(profile?.username || '');
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Sync state with profile when it loads from Supabase
    useEffect(() => {
        if (profile?.username) {
            setUsername(profile.username);
        }
    }, [profile]);

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "might_backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleChangePassword = async () => {
        if (!newPassword) return;
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            setPasswordMessage(`Error: ${error.message}`);
        } else {
            setPasswordMessage('Password updated successfully');
            setNewPassword('');
        }
    };

    const handleUpdateProfile = async () => {
        try {
            setIsEditingProfile(true);
            await updateProfile({ username });
            alert('Profile updated');
        } catch (e: any) {
            console.error(e);
            alert(`Failed to update profile: ${e.message || e.error_description || 'Unknown error'}`);
        } finally {
            setIsEditingProfile(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm(isGuest ? 'Clear all local data?' : 'Delete account? This cannot be undone.')) {
            if (isGuest) {
                await clearData();
                window.location.reload();
            } else {
                alert('Please delete via Supabase Dashboard for security reasons in this demo.');
            }
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-50 transition-opacity duration-200"
                    onClick={onClose}
                />
            )}

            {/* Slide-in Panel */}
            <div
                className={cn(
                    "fixed top-0 right-0 h-full w-[400px] bg-white shadow-elevated z-[60] transform transition-transform duration-300 ease-in-out border-l border-border flex flex-col",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex items-center justify-between p-8 border-b border-border">
                    <h2 className="text-xl font-semibold">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md text-text-secondary hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    {/* Account Section */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-text-tertiary">Account</h3>

                        {isGuest ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-border space-y-3">
                                <p className="text-sm text-text-secondary">You are using Guest Mode. Data is saved locally.</p>
                                <Link to="/signup" onClick={onClose}>
                                    <Button className="w-full">Create Account to Sync</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-secondary">Email</span>
                                    <span className="font-medium">{user?.email}</span>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-border">
                                    <p className="text-sm font-medium">Username</p>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Username"
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            className="h-9"
                                        />
                                        <Button size="sm" onClick={handleUpdateProfile} isLoading={isEditingProfile}>Save</Button>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-border">
                                    <p className="text-sm font-medium">Change Password</p>
                                    <div className="flex gap-2">
                                        <Input
                                            type="password"
                                            placeholder="New password"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            className="h-9"
                                        />
                                        <Button size="sm" onClick={handleChangePassword} disabled={!newPassword}>Update</Button>
                                    </div>
                                    {passwordMessage && <p className="text-xs text-text-secondary">{passwordMessage}</p>}
                                </div>
                            </div>
                        )}

                        {/* Preferences */}
                        <div className="pt-4 border-t border-border">
                            <h4 className="text-sm font-medium mb-3">Preferences</h4>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-text-secondary">Show Smart Suggestions</span>
                                <button
                                    onClick={() => preferences.setShowSuggestions(!preferences.showSuggestions)}
                                    className={cn(
                                        "w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out border-2 border-transparent focus:outline-none",
                                        preferences.showSuggestions ? "bg-black" : "bg-gray-200"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "block w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200",
                                            preferences.showSuggestions ? "translate-x-5" : "translate-x-0"
                                        )}
                                    />
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Data Management Section */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-text-tertiary">Data Management</h3>

                        <div className="space-y-2">
                            <Button variant="secondary" className="w-full justify-between" onClick={handleExport}>
                                <span className="flex items-center"><Download className="w-4 h-4 mr-2" /> Export Data</span>
                                <span className="text-xs text-text-tertiary">{entries.length} entries</span>
                            </Button>

                            <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleDeleteAccount}>
                                <Trash2 className="w-4 h-4 mr-2" /> {isGuest ? 'Clear Local Data' : 'Delete Account'}
                            </Button>
                        </div>
                    </section>

                    {/* About Section */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-text-tertiary">About</h3>
                        <div className="text-sm text-text-secondary space-y-1">
                            <p>Might v2.1.0 (Guest & Profiles)</p>
                            <a href="#" className="flex items-center text-black hover:underline">
                                Documentation <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                        </div>
                    </section>

                    <div className="pt-8">
                        <Button onClick={() => signOut()} variant="secondary" className="w-full">
                            <LogOut className="w-4 h-4 mr-2" /> {isGuest ? 'Exit Guest Mode' : 'Sign Out'}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
