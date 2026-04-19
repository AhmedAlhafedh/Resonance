import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, Highlighter, MessageSquarePlus, Bookmark, BookmarkCheck, Copy, Check } from 'lucide-react';
import { useLectureStore } from '../../../store/lectureStore';

interface HighlightPopoverProps {
    position: { x: number; y: number };
    onHighlight: (color: string) => void;
    onNote: () => void;
}

const HIGHLIGHT_COLORS = [
    { color: '#7c5cfc', label: 'Purple' },
    { color: '#10d98a', label: 'Green' },
    { color: '#f59e0b', label: 'Yellow' },
    { color: '#f43f5e', label: 'Pink' },
];

function HighlightPopover({ position, onHighlight, onNote }: HighlightPopoverProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="fixed z-50 glass-card shadow-panel p-2 flex items-center gap-1"
            style={{ left: position.x, top: position.y - 50 }}
        >
            <Highlighter size={13} className="text-text-muted mr-1" />
            {HIGHLIGHT_COLORS.map((h) => (
                <button
                    key={h.color}
                    className="w-5 h-5 rounded-full border-2 border-transparent hover:border-white/40 transition-all hover:scale-110"
                    style={{ background: h.color }}
                    title={h.label}
                    onClick={() => onHighlight(h.color)}
                />
            ))}
            <div className="w-px h-4 bg-border-default mx-1" />
            <button className="btn-ghost py-1 px-2 text-xs" onClick={onNote}>
                <MessageSquarePlus size={11} /> Note
            </button>
        </motion.div>
    );
}

export default function TranscriptTab() {
    const activeLecture = useLectureStore((state) => 
        state.activeLectureId ? state.lectures.find(l => l.id === state.activeLectureId) : null
    );
    const { addHighlight, toggleBookmark } = useLectureStore();
    const segments = activeLecture?.content?.transcript ?? [];
    const [popover, setPopover] = useState<{ segmentId: string; text: string; x: number; y: number } | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseUp = (segmentId: string) => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
            setPopover(null);
            return;
        }
        const text = selection.toString().trim();
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setPopover({ segmentId, text, x: rect.left + rect.width / 2 - 60, y: rect.top });
    };

    const handleHighlight = (color: string) => {
        if (!popover || !activeLecture) return;
        addHighlight(activeLecture.id, {
            segmentId: popover.segmentId,
            startOffset: 0,
            endOffset: popover.text.length,
            selectedText: popover.text,
            color,
        });
        setPopover(null);
        window.getSelection()?.removeAllRanges();
    };

    const copyText = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const isBookmarked = (id: string) => activeLecture?.bookmarks.some((b) => b.sectionId === id);

    if (segments.length === 0) return (
        <div className="flex flex-col items-center justify-center h-48 text-text-muted">
            <p className="text-sm">No transcript available</p>
        </div>
    );

    return (
        <div className="animate-fade-in" ref={containerRef}>
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-text-primary">Full Transcript</h3>
                    <p className="text-xs text-text-muted mt-0.5">Select text to highlight · {segments.length} segments</p>
                </div>
            </div>

            <div className="space-y-3" onMouseLeave={() => setPopover(null)}>
                {segments.map((seg) => (
                    <motion.div
                        key={seg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-4 group"
                    >
                        {/* Segment header */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-surface-4 rounded text-[10px] font-mono text-text-muted">
                                    <Clock size={9} />
                                    {seg.timestamp}
                                </div>
                                {seg.speaker && (
                                    <span className="text-[10px] font-semibold text-accent">{seg.speaker}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    className="p-1 rounded text-text-muted hover:text-amber-400 transition-colors"
                                    onClick={() => toggleBookmark(activeLecture!.id, seg.id, `Segment @ ${seg.timestamp}`)}
                                >
                                    {isBookmarked(seg.id) ? <BookmarkCheck size={12} className="text-amber-400" /> : <Bookmark size={12} />}
                                </button>
                                <button
                                    className="p-1 rounded text-text-muted hover:text-accent transition-colors"
                                    onClick={() => copyText(seg.text, seg.id)}
                                >
                                    {copiedId === seg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                </button>
                            </div>
                        </div>

                        {/* Transcript text — selectable */}
                        <p
                            className="text-sm text-text-secondary leading-relaxed select-text cursor-text"
                            onMouseUp={() => handleMouseUp(seg.id)}
                        >
                            {seg.text}
                        </p>

                        {/* Show existing highlights for this segment */}
                        {activeLecture?.highlights.filter((h) => h.segmentId === seg.id).map((h) => (
                            <div key={h.id} className="mt-2 flex items-start gap-2 p-2 rounded-md" style={{ background: `${h.color}15`, borderLeft: `3px solid ${h.color}` }}>
                                <Highlighter size={11} style={{ color: h.color }} className="mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-medium" style={{ color: h.color }}>&ldquo;{h.selectedText}&rdquo;</p>
                                    {h.note && <p className="text-xs text-text-muted mt-1">{h.note}</p>}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ))}
            </div>

            {/* Highlight popover */}
            {popover && (
                <HighlightPopover
                    position={{ x: popover.x, y: popover.y }}
                    onHighlight={handleHighlight}
                    onNote={() => setPopover(null)}
                />
            )}
        </div>
    );
}
