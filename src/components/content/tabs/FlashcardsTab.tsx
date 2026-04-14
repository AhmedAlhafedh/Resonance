import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react';
import { useLectureStore } from '../../../store/lectureStore';

export default function FlashcardsTab() {
    const activeLecture = useLectureStore((state) => 
        state.activeLectureId ? state.lectures.find(l => l.id === state.activeLectureId) : null
    );
    const flashcards = activeLecture?.content?.flashcards ?? [];
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [order, setOrder] = useState<number[]>(flashcards.map((_, i) => i));

    if (flashcards.length === 0) return (
        <div className="flex flex-col items-center justify-center h-48 text-text-muted">
            <p className="text-sm">No flashcards available</p>
        </div>
    );

    const orderedCards = order.map((i) => flashcards[i]);
    const card = orderedCards[currentIndex];

    const next = () => { setFlipped(false); setTimeout(() => setCurrentIndex((i) => (i + 1) % orderedCards.length), 100); };
    const prev = () => { setFlipped(false); setTimeout(() => setCurrentIndex((i) => (i - 1 + orderedCards.length) % orderedCards.length), 100); };

    const shuffle = () => {
        const shuffled = [...order].sort(() => Math.random() - 0.5);
        setOrder(shuffled);
        setCurrentIndex(0);
        setFlipped(false);
    };

    const reset = () => {
        setOrder(flashcards.map((_, i) => i));
        setCurrentIndex(0);
        setFlipped(false);
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="text-sm font-semibold text-text-primary">Flashcards</h3>
                    <p className="text-xs text-text-muted mt-0.5">{currentIndex + 1} of {orderedCards.length}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="btn-ghost text-xs" onClick={shuffle}><Shuffle size={13} /> Shuffle</button>
                    <button className="btn-ghost text-xs" onClick={reset}><RotateCcw size={13} /> Reset</button>
                </div>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1 mb-5 flex-wrap">
                {orderedCards.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => { setCurrentIndex(i); setFlipped(false); }}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 bg-accent' : 'w-1.5 bg-surface-4 hover:bg-surface-5'
                            }`}
                    />
                ))}
            </div>

            {/* Card */}
            <div className="perspective-1000 mb-5" style={{ height: 280 }}>
                <motion.div
                    className="relative w-full h-full preserve-3d cursor-pointer"
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
                    onClick={() => setFlipped(!flipped)}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* Front — Question */}
                    <div
                        className="absolute inset-0 backface-hidden glass-card p-6 flex flex-col items-center justify-center text-center"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mb-4 text-accent text-sm font-bold">Q</div>
                        <p className="text-base font-semibold text-text-primary leading-relaxed">{card.question}</p>
                        <p className="text-xs text-text-muted mt-4">Click to reveal answer</p>
                    </div>

                    {/* Back — Answer */}
                    <div
                        className="absolute inset-0 backface-hidden glass-card p-6 flex flex-col items-center justify-center text-center border-accent/30"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'rgba(124,92,252,0.08)', borderColor: 'rgba(124,92,252,0.3)' }}
                    >
                        <div className="w-8 h-8 rounded-full bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center mb-4 text-emerald-400 text-sm font-bold">A</div>
                        <p className="text-sm text-text-secondary leading-relaxed">{card.answer}</p>
                    </div>
                </motion.div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4">
                <button className="btn-secondary" onClick={prev}><ChevronLeft size={16} /> Prev</button>
                <button
                    className={`btn-secondary ${flipped ? 'border-emerald-400/30 text-emerald-400 bg-emerald-400/10' : ''}`}
                    onClick={() => setFlipped(!flipped)}
                >
                    {flipped ? 'Hide Answer' : 'Show Answer'}
                </button>
                <button className="btn-secondary" onClick={next}>Next <ChevronRight size={16} /></button>
            </div>
        </div>
    );
}
