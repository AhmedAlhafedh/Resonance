import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, ChevronDown, ChevronRight, Plus,
    Clock, Filter, Folder, Mic, MoreHorizontal, Trash2
} from 'lucide-react';
import { useLectureStore, useUIStore } from '../../store/lectureStore';
import { SUBJECT_FOLDERS, SUBJECT_COLORS } from '../../data/dummyData';
import type { Lecture, SubjectFolder } from '../../types/lecture';

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function LectureItem({ lecture, isActive, onClick }: { lecture: Lecture; isActive: boolean; onClick: () => void }) {
    const [showMenu, setShowMenu] = useState(false);
    const { deleteLecture } = useLectureStore();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`group relative flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${isActive ? 'bg-accent/15 border border-accent/30' : 'hover:bg-surface-3 border border-transparent'
                }`}
            onClick={onClick}
        >
            <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-sm ${isActive ? 'bg-accent text-white' : 'bg-surface-4 text-text-secondary'
                }`}>
                <Mic size={12} />
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isActive ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
                    {lecture.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-muted">{formatDate(lecture.uploadedAt)}</span>
                    <span className="text-xs text-text-disabled">·</span>
                    <span className="text-xs text-text-muted">{lecture.duration}</span>
                </div>
                {lecture.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {lecture.tags.slice(0, 2).map((tag) => (
                            <span key={tag.id} className="tag bg-surface-4 text-text-muted text-[10px]">
                                {tag.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Score badge */}
            <div className={`flex-shrink-0 text-xs font-semibold mt-0.5 ${lecture.confidenceScore >= 90 ? 'text-emerald-400' :
                lecture.confidenceScore >= 75 ? 'text-accent' : 'text-amber-400'
                }`}>
                {lecture.confidenceScore}%
            </div>

            {/* Context menu */}
            <button
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-5 text-text-muted hover:text-text-primary transition-all"
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            >
                <MoreHorizontal size={12} />
            </button>
            {showMenu && (
                <div className="absolute right-2 top-7 z-50 glass-card p-1 min-w-[140px] shadow-panel">
                    <button
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors"
                        onClick={(e) => { e.stopPropagation(); deleteLecture(lecture.id); setShowMenu(false); }}
                    >
                        <Trash2 size={12} /> Delete lecture
                    </button>
                </div>
            )}
        </motion.div>
    );
}

export default function Sidebar() {
    const { lectures, activeLectureId, setActiveLecture, recentlyOpenedIds, clearAllLectures } = useLectureStore();
    const {
        searchQuery, setSearchQuery,
        filterSubject, setFilterSubject,
        filterDateRange, setFilterDateRange,
        expandedFolders, toggleFolder,
        setUploadModalOpen,
        sidebarCollapsed
    } = useUIStore();
    const [showFilters, setShowFilters] = useState(false);

    const filteredLectures = lectures.filter((l) => {
        const matchesSearch = !searchQuery ||
            l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.tags.some((t) => t.label.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesSubject = filterSubject === 'All' || l.subject === filterSubject;
        const matchesDate = filterDateRange === 'all' || (() => {
            const days = filterDateRange === '7d' ? 7 : filterDateRange === '30d' ? 30 : 90;
            const cutoff = new Date(Date.now() - days * 86400000);
            return new Date(l.uploadedAt) >= cutoff;
        })();
        return matchesSearch && matchesSubject && matchesDate;
    });

    const lecturesByFolder = SUBJECT_FOLDERS.reduce((acc, folder) => {
        acc[folder] = filteredLectures.filter((l) => l.subject === folder);
        return acc;
    }, {} as Record<SubjectFolder, Lecture[]>);

    const recentLectures = recentlyOpenedIds
        .map((id) => lectures.find((l) => l.id === id))
        .filter(Boolean) as Lecture[];

    if (sidebarCollapsed) return null;

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col h-full bg-surface-1 border-r border-border-subtle"
            style={{ width: 280 }}
        >
            {/* Header */}
            <div className="p-4 border-b border-border-subtle">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-purple-700 flex items-center justify-center">
                        <Mic size={14} className="text-white" />
                    </div>
                    <span className="font-bold text-sm text-text-primary tracking-tight">Resonance</span>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-2.5 text-text-muted" />
                    <input
                        className="input-field pl-8 text-xs"
                        placeholder="Search lectures..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filter toggle */}
                <button
                    className="mt-2 flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter size={11} />
                    Filters
                    <ChevronDown size={11} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-2 space-y-2">
                                <div>
                                    <label className="text-[10px] text-text-disabled uppercase tracking-widest mb-1 block">Subject</label>
                                    <select
                                        className="input-field text-xs"
                                        value={filterSubject}
                                        onChange={(e) => setFilterSubject(e.target.value as SubjectFolder | 'All')}
                                    >
                                        <option value="All">All Subjects</option>
                                        {SUBJECT_FOLDERS.map((f) => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-text-disabled uppercase tracking-widest mb-1 block">Date Range</label>
                                    <select
                                        className="input-field text-xs"
                                        value={filterDateRange}
                                        onChange={(e) => setFilterDateRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
                                    >
                                        <option value="all">All Time</option>
                                        <option value="7d">Past 7 Days</option>
                                        <option value="30d">Past 30 Days</option>
                                        <option value="90d">Past 90 Days</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-4">

                {/* Recently Opened */}
                {recentLectures.length > 0 && !searchQuery && (
                    <div>
                        <div className="flex items-center gap-1.5 px-2 mb-1">
                            <Clock size={11} className="text-text-disabled" />
                            <span className="text-[10px] text-text-disabled uppercase tracking-widest font-medium">Recent</span>
                        </div>
                        <div className="space-y-0.5">
                            {recentLectures.slice(0, 3).map((lecture) => (
                                <LectureItem
                                    key={lecture.id}
                                    lecture={lecture}
                                    isActive={lecture.id === activeLectureId}
                                    onClick={() => setActiveLecture(lecture.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Folder System */}
                <div>
                    <div className="flex items-center gap-1.5 px-2 mb-1">
                        <Folder size={11} className="text-text-disabled" />
                        <span className="text-[10px] text-text-disabled uppercase tracking-widest font-medium">Folders</span>
                    </div>
                    {SUBJECT_FOLDERS.map((folder) => {
                        const folderLectures = lecturesByFolder[folder];
                        if (folderLectures.length === 0 && searchQuery) return null;
                        const isExpanded = expandedFolders.includes(folder);
                        return (
                            <div key={folder} className="mb-0.5">
                                <button
                                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-surface-3 transition-colors"
                                    onClick={() => toggleFolder(folder)}
                                >
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${SUBJECT_COLORS[folder]}`}>{folder[0]}</span>
                                    <span className="text-xs text-text-secondary flex-1 text-left">{folder}</span>
                                    <span className="text-[10px] text-text-disabled">{folderLectures.length}</span>
                                    {isExpanded ? <ChevronDown size={11} className="text-text-disabled" /> : <ChevronRight size={11} className="text-text-disabled" />}
                                </button>
                                <AnimatePresence>
                                    {isExpanded && folderLectures.length > 0 && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden pl-2 space-y-0.5 mt-0.5"
                                        >
                                            {folderLectures.map((lecture) => (
                                                <LectureItem
                                                    key={lecture.id}
                                                    lecture={lecture}
                                                    isActive={lecture.id === activeLectureId}
                                                    onClick={() => setActiveLecture(lecture.id)}
                                                />
                                            ))}
                                        </motion.div>
                                    )}
                                    {isExpanded && folderLectures.length === 0 && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 py-2">
                                            <p className="text-xs text-text-disabled italic">No lectures in {folder}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Upload button and Clear button */}
            <div className="p-3 border-t border-border-subtle space-y-2">
                {lectures.length > 0 && (
                    <ClearButton onClear={clearAllLectures} />
                )}
                <button
                    className="btn-primary w-full justify-center"
                    onClick={() => setUploadModalOpen(true)}
                >
                    <Plus size={15} />
                    Upload Lecture
                </button>
            </div>
        </motion.aside>
    );
}

function ClearButton({ onClear }: { onClear: () => void }) {
    const [confirm, setConfirm] = useState(false);

    return (
        <button
            className={`btn-secondary w-full justify-center py-2 text-xs transition-all duration-200 ${
                confirm 
                ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600' 
                : 'text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 border-rose-400/20'
            }`}
            onClick={() => {
                if (confirm) {
                    console.log('[UI-TRACE] Bulk clearing all lectures from store...');
                    onClear();
                    setConfirm(false);
                } else {
                    setConfirm(true);
                    setTimeout(() => setConfirm(false), 3000); // Reset after 3 seconds
                }
            }}
        >
            <Trash2 size={13} />
            {confirm ? 'Click again to confirm' : 'Clear Sidebar'}
        </button>
    );
}
