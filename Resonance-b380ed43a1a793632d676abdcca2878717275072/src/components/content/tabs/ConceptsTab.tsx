import { motion } from 'framer-motion';
import { useLectureStore } from '../../../store/lectureStore';

export default function ConceptsTab() {
    const activeLecture = useLectureStore((state) => 
        state.activeLectureId ? state.lectures.find(l => l.id === state.activeLectureId) : null
    );
    const concepts = activeLecture?.content?.keyConcepts ?? [];

    return (
        <div className="animate-fade-in">
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-text-primary">Key Concepts</h3>
                <p className="text-xs text-text-muted mt-0.5">{concepts.length} core concepts from this lecture</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
                {concepts.map((concept, i) => (
                    <motion.div
                        key={concept.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="glass-card-hover p-4 cursor-default"
                    >
                        <div className="flex items-start gap-3">
                            {concept.icon && (
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-xl">
                                    {concept.icon}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <h4 className="text-sm font-semibold text-text-primary">{concept.title}</h4>
                                    <span className="text-[10px] font-medium px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                                        #{i + 1}
                                    </span>
                                </div>
                                <p className="text-sm text-text-secondary leading-relaxed">{concept.description}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
