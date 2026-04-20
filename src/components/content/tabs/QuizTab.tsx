import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, RotateCcw, Trophy, ChevronRight, Undo } from 'lucide-react';
import { useLectureStore } from '../../../store/lectureStore';

export default function QuizTab() {
    const activeLecture = useLectureStore((state) => 
        state.activeLectureId ? state.lectures.find(l => l.id === state.activeLectureId) : null
    );
    const questions = activeLecture?.content?.quiz ?? [];
    const [currentQ, setCurrentQ] = useState(0);
    const [selected, setSelected] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [revealed, setRevealed] = useState<Set<string>>(new Set());
    const [history, setHistory] = useState<any[]>([]);
    const [confidence, setConfidence] = useState<number>(0);
    const [totalQuestions, setTotalQuestions] = useState<number>(questions.length);
    
    const updateLecture = useLectureStore((state) => state.updateLecture);

    if (questions.length === 0) return (
        <div className="flex flex-col items-center justify-center h-48 text-text-muted">
            <p className="text-sm">No quiz questions available</p>
        </div>
    );


    const reset = () => {
        setSelected({});
        setSubmitted(false);
        setRevealed(new Set());
        setCurrentQ(0);
        setHistory([]);
    };

    const saveStateToHistory = () => {
        setHistory(prev => [...prev, { currentQ, selected, revealed: new Set(revealed) }]);
    };

    const undo = () => {
        if (history.length === 0) return;
        const prev = history[history.length - 1];
        setCurrentQ(prev.currentQ);
        setSelected(prev.selected);
        setRevealed(prev.revealed);
        setHistory(history.slice(0, -1));
    };

    const submitQuiz = async () => {
        setSubmitted(true);
        if (!activeLecture) return;
        
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
            const res = await fetch(`${backendUrl}/api/quiz/evaluate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answers: selected,
                    questions: questions.map(q => ({ id: q.id, correctOptionId: q.correctOptionId }))
                })
            });
            const data = await res.json();
            
            console.log("API RESPONSE:", data);
            console.log("confidence:", data.confidence);
            console.log("total_questions:", data.total_questions);
            
            if (data && typeof data.confidence === 'number') {
                setConfidence(data.confidence);
                setTotalQuestions(data.total_questions);
                updateLecture(activeLecture.id, { confidenceScore: data.confidence });
            } else {
                const fallbackTotal = questions.length;
                const fallbackConfidence = fallbackTotal > 0 ? (score / fallbackTotal) * 100 : 0;
                setConfidence(fallbackConfidence);
                setTotalQuestions(fallbackTotal);
                updateLecture(activeLecture.id, { confidenceScore: fallbackConfidence });
            }
        } catch (error) {
            console.error("Failed to evaluate quiz", error);
            const fallbackTotal = questions.length;
            const fallbackConfidence = fallbackTotal > 0 ? (score / fallbackTotal) * 100 : 0;
            setConfidence(fallbackConfidence);
            setTotalQuestions(fallbackTotal);
            updateLecture(activeLecture.id, { confidenceScore: fallbackConfidence });
        }
    };

    const revealCurrent = () => {
        saveStateToHistory();
        setRevealed((prev) => new Set([...prev, questions[currentQ].id]));
    };

    if (submitted) {
        const score = questions.filter((q) => selected[q.id] === q.correctOptionId).length;
        const pct = Math.round((score / questions.length) * 100);

        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="animate-fade-in">
                {/* Score card */}
                <div className="glass-card p-8 text-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center mx-auto mb-4">
                        <Trophy size={28} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-text-primary mb-1">{score}/{totalQuestions}</h3>
                    <p className="text-sm text-text-muted mb-3">{Math.round(confidence)}% correct</p>
                    <div className="h-2 bg-surface-4 rounded-full overflow-hidden mb-4">
                        <motion.div
                            className={`h-full rounded-full ${confidence >= 80 ? 'bg-emerald-400' : confidence >= 60 ? 'bg-amber-400' : 'bg-rose-400'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${confidence}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                    </div>
                    <p className="text-sm text-text-secondary">
                        {confidence >= 80 ? '🎉 Excellent work!' : confidence >= 60 ? '👍 Good effort, review the misses.' : '📖 Consider re-reading the lecture.'}
                    </p>
                </div>

                {/* Question review */}
                <div className="space-y-3">
                    {questions.map((q, idx) => {
                        const userAnswer = selected[q.id];
                        const correct = userAnswer === q.correctOptionId;
                        return (
                            <div key={q.id} className={`glass-card p-4 border ${correct ? 'border-emerald-400/20' : 'border-rose-400/20'}`}>
                                <div className="flex items-start gap-2 mb-2">
                                    {correct ? <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" /> : <XCircle size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />}
                                    <p className="text-sm font-medium text-text-primary">{idx + 1}. {q.question}</p>
                                </div>
                                <p className="text-xs text-text-muted mt-2 leading-relaxed pl-5">{q.explanation}</p>
                            </div>
                        );
                    })}
                </div>

                <button className="btn-secondary w-full justify-center mt-4" onClick={reset}>
                    <RotateCcw size={14} /> Retake Quiz
                </button>
            </motion.div>
        );
    }

    const q = questions[currentQ];
    const isRevealed = revealed.has(q.id);
    const currentIndex = currentQ;
    const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

    console.log("currentIndex:", currentIndex);
    console.log("totalQuestions:", totalQuestions);
    console.log("progress:", progress);

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="text-sm font-semibold text-text-primary">Quiz</h3>
                    <p className="text-xs text-text-muted mt-0.5">Question {currentQ + 1} of {totalQuestions}</p>
                </div>
                <div className="flex gap-2 items-center">
                    <button 
                        onClick={undo}
                        disabled={history.length === 0}
                        className={`p-1 rounded transition-colors ${history.length > 0 ? 'text-text-secondary hover:text-text-primary hover:bg-surface-3' : 'text-text-muted opacity-50 cursor-not-allowed'}`}
                        title="Undo last action"
                    >
                        <Undo size={16} />
                    </button>
                    <div className="flex gap-1 ml-2">
                        {questions.map((_, i) => {
                            const answered = selected[questions[i].id];
                            const correct = answered === questions[i].correctOptionId;
                            return (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (i !== currentQ) {
                                            saveStateToHistory();
                                            setCurrentQ(i);
                                        }
                                    }}
                                    className={`w-6 h-6 rounded text-[10px] font-bold transition-colors ${i === currentQ ? 'bg-accent text-white' :
                                        answered ? (correct ? 'bg-emerald-400/20 text-emerald-400' : 'bg-rose-400/20 text-rose-400') :
                                            'bg-surface-4 text-text-muted hover:bg-surface-5'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-surface-4 rounded-full overflow-hidden mb-5">
                <motion.div
                    className="h-full bg-accent rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQ}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card p-5 mb-4"
                >
                    <p className="text-sm font-semibold text-text-primary leading-relaxed">{q.question}</p>
                </motion.div>
            </AnimatePresence>

            {/* Options */}
            <div className="space-y-2 mb-5">
                {q.options.map((opt, optIndex) => {
                    const isSelected = selected[q.id] === opt.id;
                    const isCorrect = opt.id === q.correctOptionId;
                    const showResult = isRevealed;

                    let classes = 'glass-card-hover p-4 cursor-pointer flex items-center gap-3 ';
                    if (showResult) {
                        if (isCorrect) classes += 'border-emerald-400/40 bg-emerald-400/10';
                        else if (isSelected && !isCorrect) classes += 'border-rose-400/40 bg-rose-400/10';
                    } else if (isSelected) {
                        classes += 'border-accent/40 bg-accent/10';
                    }

                    return (
                        <motion.div
                            key={opt.id}
                            className={classes}
                            whileHover={!showResult ? { scale: 1.01 } : {}}
                            onClick={() => { 
                                if (!isRevealed && selected[q.id] !== opt.id) {
                                    saveStateToHistory();
                                    setSelected((prev) => ({ ...prev, [q.id]: opt.id })); 
                                }
                            }}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${showResult && isCorrect ? 'border-emerald-400 text-emerald-400' :
                                showResult && isSelected && !isCorrect ? 'border-rose-400 text-rose-400' :
                                    isSelected ? 'border-accent bg-accent text-white' :
                                        'border-border-default text-text-muted'
                                }`}>
                                {String.fromCharCode(65 + optIndex)}
                            </div>
                            <p className="text-sm text-text-secondary">{opt.text}</p>
                            {showResult && isCorrect && <CheckCircle2 size={14} className="text-emerald-400 ml-auto flex-shrink-0" />}
                            {showResult && isSelected && !isCorrect && <XCircle size={14} className="text-rose-400 ml-auto flex-shrink-0" />}
                        </motion.div>
                    );
                })}
            </div>

            {/* Explanation */}
            {isRevealed && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-surface-3 rounded-lg border border-border-subtle mb-4">
                    <p className="text-xs font-semibold text-accent mb-1">Explanation</p>
                    <p className="text-xs text-text-secondary leading-relaxed">{q.explanation}</p>
                </motion.div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
                {selected[q.id] && !isRevealed && (
                    <button className="btn-secondary flex-1 justify-center" onClick={revealCurrent}>
                        Check Answer
                    </button>
                )}
                {currentQ < questions.length - 1 ? (
                    <button
                        className="btn-primary flex-1 justify-center"
                        disabled={!selected[q.id]}
                        onClick={() => {
                            saveStateToHistory();
                            setCurrentQ(currentQ + 1);
                        }}
                    >
                        Next <ChevronRight size={14} />
                    </button>
                ) : (
                    <button
                        className="btn-primary flex-1 justify-center"
                        disabled={Object.keys(selected).length < questions.length}
                        onClick={submitQuiz}
                    >
                        <Trophy size={14} /> Submit Quiz
                    </button>
                )}
            </div>
        </div>
    );
}
