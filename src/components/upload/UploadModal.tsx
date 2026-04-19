import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileAudio, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { mapBackendResponseToContent, mapTopicsToTags } from '../../utils/dataMapper';
import { useLectureStore, useUIStore } from '../../store/lectureStore';
import { uploadToS3 } from '../../services/aws/s3';
import type { Lecture, ProcessingStage } from '../../types/lecture';

interface Stage {
    key: ProcessingStage | 'transcribing' | 'analyzing';
    label: string;
    description: string;
}

const STAGES: Stage[] = [
    { key: 'uploading', label: 'Uploading...', description: 'Sending file to S3' },
    { key: 'transcribing', label: 'Transcribing...', description: 'Extracting text via AWS Transcribe' },
    { key: 'analyzing', label: 'Analyzing...', description: 'Generating summary via Gemini' },
    { key: 'done', label: 'Done', description: 'Lecture ready to study' },
];

const STAGE_ORDER = ['uploading', 'transcribing', 'analyzing', 'done'];

function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadModal() {
    const { uploadModalOpen, setUploadModalOpen } = useUIStore();
    const { setProcessingStatus, addLecture, setActiveLecture } = useLectureStore();
    const [file, setFile] = useState<File | null>(null);
    const [stage, setStage] = useState<string>('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    
    // For cleaning up polling
    const pollIntervalRef = useRef<number | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.aac'] },
        maxFiles: 1,
        disabled: stage !== 'idle',
        onDrop: (accepted, rejected) => {
            if (rejected.length > 0) {
                setError('Only audio files (MP3, WAV, M4A) are supported.');
                return;
            }
            if (accepted[0]) {
                setFile(accepted[0]);
                setError(null);
            }
        },
    });

    const updateStage = (s: string, p: number, msg?: string) => {
        setStage(s);
        setProgress(p);
        setProcessingStatus({ stage: s as ProcessingStage, progress: p, message: msg });
    };

    const handleUpload = async () => {
        if (!file) return;
        setError(null);
        console.log('[UI-TRACE] Start upload for:', file.name);

        try {
            // === Stage 1: Uploading to S3 ===
            updateStage('uploading', 0, 'Uploading...');
            const uploadResult = await uploadToS3(file, (p) => {
                setProgress(p);
                setProcessingStatus({ stage: 'uploading', progress: p, message: `Uploading... ${p}%` });
            });
            
            console.log('[UI-TRACE] S3 Upload Finished. JobID:', uploadResult.jobId);

            // === Stage 2 & 3: Polling Backend ===
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
            const jobId = uploadResult.jobId;
            
            pollIntervalRef.current = window.setInterval(async () => {
                try {
                    console.debug('[UI-TRACE] Polling status for:', jobId);
                    const res = await fetch(`${backendUrl}/status/${jobId}`);
                    const responseText = await res.text();
                    
                    if (!res.ok) {
                        let errorDetail = '';
                        try {
                            const errData = JSON.parse(responseText);
                            errorDetail = errData.detail || errData.message || '';
                        } catch {
                            errorDetail = responseText || res.statusText;
                        }
                        throw new Error(`Status check failed (${res.status}): ${errorDetail}`);
                    }
                    
                    let data;
                    try {
                        data = JSON.parse(responseText);
                    } catch (e) {
                        console.error('\n=======================================');
                        console.error('[UI-TRACE] STATUS JSON PARSE ERROR');
                        console.error('URL:', `${backendUrl}/status/${jobId}`);
                        console.error('HTTP Status:', res.status, res.statusText);
                        console.error('Raw Response Body:', responseText);
                        console.error('=======================================\n');
                        // Avoid killing the polling loop, but log the failure
                        return;
                    }
                    console.debug('[UI-TRACE] Received status:', data.status, data.detail || '');
                    
                    if (data.status === 'Transcribing') {
                        updateStage('transcribing', 30, data.detail || 'Transcribing audio...');
                    } else if (data.status === 'Analyzing') {
                        updateStage('analyzing', 70, 'Analyzing via AI...');
                    } else if (data.status === 'Completed') {
                        console.log('[UI-TRACE] Job Completed! Cleaning up...');
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                        }
                        
                        if (done) return;
                        
                        // Use shared mapper for consistency
                        const content = mapBackendResponseToContent(data);
                        const tags = mapTopicsToTags(data.topics);

                        const newLecture: Lecture = {
                            id: jobId, // Use stable Job ID instead of random UUID
                            title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
                            description: typeof content.detailedSummary === 'string' ? content.detailedSummary.slice(0, 100) + '...' : 'Analysis complete',
                            subject: 'Other',
                            uploadedAt: new Date().toISOString(),
                            duration: '--:--',
                            fileSizeMB: Math.round((file.size / (1024 * 1024)) * 10) / 10,
                            tags: tags,
                            confidenceScore: 0, // Placeholder 0 until AI returns a real score
                            status: 'done',
                            content,
                            highlights: [],
                            notes: [],
                            bookmarks: [],
                            s3Key: uploadResult.s3Key,
                        };

                        addLecture(newLecture);
                        setActiveLecture(newLecture.id);
                        updateStage('done', 100, 'Complete!');
                        setDone(true);
                    } else if (data.status.startsWith('Failed')) {
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                        throw new Error(data.status);
                    }
                } catch (pollErr) {
                    console.error("Polling error", pollErr);
                    // Don't kill polling on single network failure
                }
            }, 3000);

        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.';
            setError(msg);
            setStage('idle');
            setProcessingStatus({ stage: 'error', progress: 0, error: msg });
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
    };

    const handleClose = () => {
        setUploadModalOpen(false);
        setTimeout(() => {
            setFile(null);
            setStage('idle');
            setProgress(0);
            setError(null);
            setDone(false);
            setProcessingStatus({ stage: 'idle', progress: 0 });
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }, 300);
    };

    const currentStageIndex = STAGE_ORDER.indexOf(stage);

    return (
        <AnimatePresence>
            {uploadModalOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="glass-card w-full max-w-lg shadow-panel"
                            initial={{ scale: 0.94, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.94, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-border-subtle">
                                <div>
                                    <h2 className="text-base font-semibold text-text-primary">Upload Lecture</h2>
                                    <p className="text-xs text-text-muted mt-0.5">MP3, WAV, M4A · Max 500MB</p>
                                </div>
                                <button
                                    className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-4 transition-colors"
                                    onClick={handleClose}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Drop zone */}
                                {!file && (
                                    <div
                                        {...getRootProps()}
                                        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${isDragActive
                                            ? 'border-accent bg-accent/10 shadow-glow'
                                            : 'border-border-default hover:border-accent/50 hover:bg-surface-3'
                                            }`}
                                    >
                                        <input {...getInputProps()} />
                                        <motion.div
                                            animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300 }}
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${isDragActive ? 'bg-accent' : 'bg-surface-4'
                                                }`}
                                        >
                                            <Upload size={24} className={isDragActive ? 'text-white' : 'text-text-muted'} />
                                        </motion.div>
                                        <p className="text-sm font-medium text-text-primary mb-1">
                                            {isDragActive ? 'Drop to upload' : 'Drag & drop audio file'}
                                        </p>
                                        <p className="text-xs text-text-muted">or <span className="text-accent">browse files</span></p>
                                    </div>
                                )}

                                {/* File selected */}
                                {file && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                                        {/* File info */}
                                        <div className="flex items-center gap-3 p-3 bg-surface-3 rounded-lg border border-border-subtle">
                                            <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                                                <FileAudio size={18} className="text-accent" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                                                <p className="text-xs text-text-muted">{formatBytes(file.size)}</p>
                                            </div>
                                            {stage === 'idle' && (
                                                <button className="p-1 text-text-muted hover:text-rose-400 transition-colors" onClick={() => setFile(null)}>
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Progress stages */}
                                        {stage !== 'idle' && (
                                            <div className="space-y-1">
                                                {STAGES.map((s) => {
                                                    const isPast = STAGE_ORDER.indexOf(s.key) < currentStageIndex;
                                                    const isCurrent = s.key === stage;
                                                    return (
                                                        <div key={s.key} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isCurrent ? 'bg-accent/10' : ''}`}>
                                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isPast ? 'bg-emerald-400/20 text-emerald-400' :
                                                                isCurrent ? 'bg-accent/20 text-accent' : 'bg-surface-4 text-text-disabled'
                                                                }`}>
                                                                {isPast ? <CheckCircle2 size={11} /> : isCurrent ? <Loader2 size={11} className="animate-spin" /> : <div className="w-2 h-2 rounded-full bg-current opacity-40" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className={`text-xs font-medium ${isPast ? 'text-emerald-400' : isCurrent ? 'text-accent' : 'text-text-disabled'}`}>
                                                                    {s.label}
                                                                </span>
                                                                {isCurrent && <span className="text-[10px] text-text-muted ml-2">{s.description}</span>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Progress bar */}
                                                {stage !== 'done' && (
                                                    <div className="mt-2">
                                                        <div className="flex justify-between text-[10px] text-text-muted mb-1.5">
                                                            <span>Overall progress</span><span>{progress}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-surface-4 rounded-full overflow-hidden">
                                                            <motion.div
                                                                className="h-full bg-gradient-to-r from-accent to-accent-soft rounded-full"
                                                                animate={{ width: `${progress}%` }}
                                                                transition={{ duration: 0.3 }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Done state */}
                                        {done && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex flex-col gap-3 p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-xl"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-emerald-400">Processing complete!</p>
                                                        <p className="text-xs text-text-muted">Your lecture is ready to study.</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Error */}
                                        {error && (
                                            <div className="flex items-center gap-2 p-3 bg-rose-400/10 border border-rose-400/20 rounded-lg">
                                                <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
                                                <p className="text-xs text-rose-400">{error}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Error without file */}
                                {error && !file && (
                                    <p className="text-xs text-rose-400 text-center">{error}</p>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-3 px-5 pb-5">
                                <button className="btn-secondary" onClick={handleClose}>
                                    {done ? 'Close' : 'Cancel'}
                                </button>
                                {!done && (
                                    <button
                                        className="btn-primary"
                                        disabled={!file || stage !== 'idle'}
                                        onClick={handleUpload}
                                    >
                                        {stage !== 'idle' && !done ? (
                                            <><Loader2 size={14} className="animate-spin" /> Processing...</>
                                        ) : (
                                            <><Upload size={14} /> Start Processing</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
