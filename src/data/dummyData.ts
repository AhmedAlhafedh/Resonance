import type { Lecture, SubjectFolder } from '../types/lecture';



export const DUMMY_LECTURES: Lecture[] = [];

export const SUBJECT_FOLDERS: SubjectFolder[] = ['AI', 'Math', 'Physics', 'History', 'Biology', 'Chemistry', 'Other'];

export const SUBJECT_COLORS: Record<SubjectFolder, string> = {
    AI: 'text-accent bg-accent/10',
    Math: 'text-sky-400 bg-sky-400/10',
    Physics: 'text-emerald-400 bg-emerald-400/10',
    History: 'text-amber-400 bg-amber-400/10',
    Biology: 'text-green-400 bg-green-400/10',
    Chemistry: 'text-rose-400 bg-rose-400/10',
    Other: 'text-text-secondary bg-surface-4',
};
