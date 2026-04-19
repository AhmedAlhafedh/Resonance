import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronDown, Settings, LogOut, CreditCard, Zap, PanelLeft } from 'lucide-react';
import { useLectureStore, useUIStore } from '../../store/lectureStore';

interface TopNavProps {
    user: { name: string; email: string; plan: string; institution?: string } | null;
}

function PlanBadge({ plan }: { plan: string }) {
    const map: Record<string, string> = {
        pro: 'bg-gradient-to-r from-accent to-purple-600 text-white',
        team: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
        free: 'bg-surface-4 text-text-muted',
    };
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[plan] ?? map.free}`}>
            {plan.toUpperCase()}
        </span>
    );
}

export default function TopNav({ user }: TopNavProps) {
    const { lectures, activeLectureId } = useLectureStore();
    const activeLecture = activeLectureId ? lectures.find(l => l.id === activeLectureId) : null;
    const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-surface-1/60 backdrop-blur-sm">
            {/* Left: Sidebar toggle + Breadcrumb */}
            <div className="flex items-center gap-3">
                <button
                    className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    title="Toggle Sidebar"
                >
                    <PanelLeft size={16} />
                </button>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-text-muted">Lectures</span>
                    {activeLecture && (
                        <>
                            <span className="text-text-disabled">/</span>
                            <span className="text-text-primary font-medium truncate max-w-[300px]">{activeLecture.title}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Right: Actions + Profile */}
            <div className="flex items-center gap-3">
                {/* Upgrade hint for free plan */}
                {user?.plan === 'free' && (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/30 text-accent text-xs font-semibold rounded-full hover:bg-accent/20 transition-colors">
                        <Zap size={11} />
                        Upgrade to Pro
                    </button>
                )}

                {/* Profile dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-3 hover:bg-surface-4 border border-border-subtle hover:border-border-default transition-all duration-200"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-purple-700 flex items-center justify-center text-white text-xs font-bold">
                            {user?.name?.charAt(0) ?? 'U'}
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-sm font-medium text-text-primary leading-tight">{user?.name ?? 'User'}</p>
                            {user?.institution && <p className="text-[10px] text-text-muted leading-tight">{user.institution}</p>}
                        </div>
                        <ChevronDown size={13} className={`text-text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {dropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 top-full mt-2 w-64 glass-card shadow-panel z-50 overflow-hidden"
                            >
                                {/* User info */}
                                <div className="px-4 py-3 border-b border-border-subtle">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-purple-700 flex items-center justify-center text-white font-bold">
                                            {user?.name?.charAt(0) ?? 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-text-primary">{user?.name}</p>
                                            <p className="text-xs text-text-muted">{user?.email}</p>
                                            <div className="mt-1"><PlanBadge plan={user?.plan ?? 'free'} /></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Menu items */}
                                <div className="p-1">
                                    <button className="btn-ghost w-full justify-start py-2.5 text-text-secondary">
                                        <User size={14} /> Profile
                                    </button>
                                    <button className="btn-ghost w-full justify-start py-2.5 text-text-secondary">
                                        <Settings size={14} /> Settings
                                    </button>
                                    <button className="btn-ghost w-full justify-start py-2.5 text-text-secondary">
                                        <CreditCard size={14} /> Billing
                                    </button>
                                </div>
                                <div className="p-1 border-t border-border-subtle">
                                    <button className="btn-ghost w-full justify-start py-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10">
                                        <LogOut size={14} /> Sign Out
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
