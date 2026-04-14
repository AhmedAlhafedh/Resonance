import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, AlertCircle, Zap, Brain, TrendingUp } from 'lucide-react';
import { useLectureStore } from '../../store/lectureStore';
import type { ProcessingStage, Tag, Bookmark } from '../../types/lecture';

const STAGES: { key: ProcessingStage; label: string; icon: React.ReactNode }[] = [
    { key: 'uploading', label: 'Uploading', icon: <Zap size={12} /> },
    { key: 'transcribing', label: 'Transcribing', icon: <Brain size={12} /> },
    { key: 'processing', label: 'Processing', icon: <Loader2 size={12} /> },
    { key: 'summarizing', label: 'Summarizing', icon: <TrendingUp size={12} /> },
    { key: 'done', label: 'Done', icon: <CheckCircle2 size={12} /> },
];

const STAGE_ORDER: ProcessingStage[] = ['uploading', 'transcribing', 'processing', 'summarizing', 'done'];

function ConfidenceGauge({ score }: { score: number }) {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const color = score >= 90 ? '#10d98a' : score >= 75 ? '#7c5cfc' : '#f59e0b';

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    {/* Background track */}
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                    {/* Score arc */}
                    <motion.circle
                        cx="50" cy="50" r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                        className="text-2xl font-bold text-text-primary"
                        style={{ color }}
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                    >
                        {score}
                    </motion.span>
                    <span className="text-[10px] text-text-muted">/ 100</span>
                </div>
            </div>
            <div className="text-center">
                <p className="text-xs font-semibold text-text-secondary">AI Confidence</p>
                <p className="text-[10px] text-text-muted mt-0.5">
                    {score >= 90 ? 'Excellent quality' : score >= 75 ? 'Good quality' : 'Review recommended'}
                </p>
            </div>
        </div>
    );
}

function ProcessingPipeline() {
    const { processingStatus } = useLectureStore();
    const { stage, progress, message, error } = processingStatus;

    if (stage === 'idle') return null;

    const currentStageIndex = STAGE_ORDER.indexOf(stage);

    return (
        <div className="space-y-1">
            {STAGES.map((s, index) => {
                const isPast = STAGE_ORDER.indexOf(s.key) < currentStageIndex;
                const isCurrent = s.key === stage;

                return (
                    <motion.div
                        key={s.key}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className={`processing-step ${isCurrent ? 'bg-accent/10 border border-accent/20' :
                            isPast ? 'bg-surface-3' : 'opacity-40'
                            }`}
                    >
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isPast ? 'bg-emerald-400/20 text-emerald-400' :
                            isCurrent ? 'bg-accent/20 text-accent animate-pulse' :
                                'bg-surface-4 text-text-disabled'
                            }`}>
                            {isPast ? <CheckCircle2 size={12} /> : isCurrent ? <Loader2 size={12} className="animate-spin" /> : <Circle size={12} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium ${isPast ? 'text-emerald-400' : isCurrent ? 'text-accent' : 'text-text-disabled'}`}>
                                {s.label}
                            </p>
                            {isCurrent && message && (
                                <p className="text-[10px] text-text-muted truncate mt-0.5">{message}</p>
                            )}
                        </div>
                    </motion.div>
                );
            })}

            {/* Progress bar */}
            {stage !== 'done' && (
                <div className="mt-2 px-1">
                    <div className="flex justify-between text-[10px] text-text-muted mb-1">
                        <span>Progress</span><span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-surface-4 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-accent to-accent-soft rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 p-2 bg-rose-400/10 border border-rose-400/20 rounded-lg mt-2">
                    <AlertCircle size={13} className="text-rose-400 flex-shrink-0" />
                    <p className="text-xs text-rose-400">{error}</p>
                </div>
            )}
        </div>
    );
}

function LectureStats({ lecture }: { lecture: any }) {
    return (
        <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
                {[
                    { label: 'Duration', value: lecture.duration },
                    { label: 'File Size', value: `${lecture.fileSizeMB}MB` },
                    { label: 'Flashcards', value: `${lecture.content?.flashcards.length ?? 0}` },
                    { label: 'Quiz Q\'s', value: `${lecture.content?.quiz.length ?? 0}` },
                ].map((stat) => (
                    <div key={stat.label} className="bg-surface-3 rounded-lg p-2.5 text-center">
                        <p className="text-xs font-semibold text-text-primary">{stat.value}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function RightPanel() {
    const { lectures, activeLectureId, processingStatus } = useLectureStore();
    const activeLecture = activeLectureId ? lectures.find(l => l.id === activeLectureId) : null;
    const isProcessing = processingStatus.stage !== 'idle' && processingStatus.stage !== 'done';

    return (
        <motion.aside
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex flex-col gap-4 p-4 bg-surface-1 border-l border-border-subtle overflow-y-auto scrollbar-thin"
            style={{ width: 240 }}
        >
            {/* Confidence Score */}
            {activeLecture && !isProcessing && (
                <div className="glass-card p-4">
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-4">Confidence Score</h3>
                    <ConfidenceGauge score={activeLecture.confidenceScore} />
                </div>
            )}

            {/* Processing pipeline — shown during active upload */}
            {isProcessing && (
                <div className="glass-card p-4">
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">Processing</h3>
                    <ProcessingPipeline />
                </div>
            )}

            {/* Lecture Stats */}
            {activeLecture && !isProcessing && activeLecture.content && (
                <div className="glass-card p-4">
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">Lecture Info</h3>
                    <LectureStats lecture={activeLecture} />
                </div>
            )}

            {/* Tags */}
            {activeLecture && activeLecture.tags.length > 0 && (
                <div className="glass-card p-4">
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-1.5">
                        {activeLecture.tags.map((tag: Tag) => (
                            <span key={tag.id} className="tag bg-accent/10 text-accent">{tag.label}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Bookmarks */}
            {activeLecture && activeLecture.bookmarks.length > 0 && (
                <div className="glass-card p-4">
                    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">Bookmarks</h3>
                    <div className="space-y-1.5">
                        {activeLecture.bookmarks.map((bm: Bookmark) => (
                            <div key={bm.id} className="flex items-center gap-2 text-xs text-text-secondary">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                {bm.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.aside>
    );
}
