import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Save, Bookmark, BookmarkCheck, RotateCcw } from 'lucide-react';
import { useLectureStore } from '../../../store/lectureStore';

interface SummaryTabProps {
    lectureId: string;
}

export default function SummaryTab({ lectureId }: SummaryTabProps) {
    const activeLecture = useLectureStore((state) => 
        state.activeLectureId ? state.lectures.find(l => l.id === state.activeLectureId) : null
    );
    const { updateContent, toggleBookmark } = useLectureStore();
    const content = activeLecture?.content;
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [showDetail, setShowDetail] = useState(false);

    if (!content) {
        return (
            <div className="flex flex-col items-center justify-center p-20 glass-card">
                <RotateCcw className="animate-spin text-accent mb-4" size={32} />
                <p className="text-sm font-semibold text-text-primary">Preparing Analysis...</p>
                <p className="text-xs text-text-muted mt-2 text-center max-w-sm">
                    Our AI is currently transcribing and summarizing your lecture. 
                    This content will appear automatically as soon as it's ready.
                </p>
            </div>
        );
    }

    const isBookmarked = (id: string) => activeLecture?.bookmarks.some((b) => b.sectionId === id);

    const startEdit = (field: string, value: string) => {
        setEditingField(field);
        setEditValue(value);
    };

    const saveEdit = (field: string) => {
        updateContent(lectureId, field, editValue);
        setEditingField(null);
    };

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Short Summary */}
            <div className="glass-card p-5">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-text-primary">Quick Summary</h3>
                        <p className="text-xs text-text-muted mt-0.5">AI-generated overview</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            className="p-1.5 rounded-md text-text-muted hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                            onClick={() => toggleBookmark(lectureId, 'short-summary', 'Quick Summary')}
                        >
                            {isBookmarked('short-summary') ? <BookmarkCheck size={13} className="text-amber-400" /> : <Bookmark size={13} />}
                        </button>
                        <button
                            className="p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                            onClick={() => startEdit('shortSummary', content.shortSummary)}
                        >
                            <Edit3 size={13} />
                        </button>
                    </div>
                </div>

                {editingField === 'shortSummary' ? (
                    <div className="space-y-2">
                        <textarea
                            className="input-field min-h-[100px] resize-none text-sm leading-relaxed"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button className="btn-primary text-xs" onClick={() => saveEdit('shortSummary')}>
                                <Save size={12} /> Save
                            </button>
                            <button className="btn-secondary text-xs" onClick={() => setEditingField(null)}>
                                <RotateCcw size={12} /> Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-text-secondary leading-relaxed">{content.shortSummary}</p>
                )}
            </div>

            {/* Detailed Summary */}
            <div className="glass-card p-5">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-text-primary">Detailed Summary</h3>
                        <p className="text-xs text-text-muted mt-0.5">In-depth lecture breakdown</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            className="p-1.5 rounded-md text-text-muted hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                            onClick={() => toggleBookmark(lectureId, 'detailed-summary', 'Detailed Summary')}
                        >
                            {isBookmarked('detailed-summary') ? <BookmarkCheck size={13} className="text-amber-400" /> : <Bookmark size={13} />}
                        </button>
                        <button
                            className="p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                            onClick={() => startEdit('detailedSummary', content.detailedSummary)}
                        >
                            <Edit3 size={13} />
                        </button>
                    </div>
                </div>

                <div className={`overflow-hidden transition-all duration-300 ${showDetail ? '' : 'max-h-40'}`}>
                    {editingField === 'detailedSummary' ? (
                        <div className="space-y-2">
                            <textarea
                                className="input-field min-h-[200px] resize-none text-sm leading-relaxed"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button className="btn-primary text-xs" onClick={() => saveEdit('detailedSummary')}>
                                    <Save size={12} /> Save
                                </button>
                                <button className="btn-secondary text-xs" onClick={() => setEditingField(null)}>
                                    <RotateCcw size={12} /> Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <ul className="list-disc pl-5 space-y-2 text-sm text-text-secondary leading-relaxed">
                            {content.detailedSummary?.split('\n').filter(line => line.trim()).map((line, i) => (
                                <li key={i}>{line.replace(/^-\s*/, '')}</li>
                            ))}
                        </ul>
                    )}
                </div>
                {!editingField && (
                    <button
                        className="mt-2 text-xs text-accent hover:text-accent-soft transition-colors"
                        onClick={() => setShowDetail(!showDetail)}
                    >
                        {showDetail ? 'Show less ↑' : 'Read more ↓'}
                    </button>
                )}
            </div>

            {/* Key Terms */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-text-primary">Key Terms</h3>
                        <p className="text-xs text-text-muted mt-0.5">{content.keyTerms.length} terms defined</p>
                    </div>
                    <button
                        className="p-1.5 rounded-md text-text-muted hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                        onClick={() => toggleBookmark(lectureId, 'key-terms', 'Key Terms')}
                    >
                        {isBookmarked('key-terms') ? <BookmarkCheck size={13} className="text-amber-400" /> : <Bookmark size={13} />}
                    </button>
                </div>
                <div className="space-y-2.5">
                    {content.keyTerms.map((term, i) => (
                        <motion.div
                            key={term.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex gap-3 p-3 bg-surface-3 rounded-lg border border-border-subtle hover:border-border-default transition-colors"
                        >
                            <div className="w-1 flex-shrink-0 bg-gradient-to-b from-accent to-purple-600 rounded-full" />
                            <div>
                                <p className="text-xs font-semibold text-accent">{term.term}</p>
                                <p className="text-xs text-text-secondary mt-1 leading-relaxed">{term.definition}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
