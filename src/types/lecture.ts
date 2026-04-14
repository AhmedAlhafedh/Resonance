// === TypeScript Types for Resonance App ===

export type ProcessingStage = 'idle' | 'uploading' | 'transcribing' | 'processing' | 'summarizing' | 'done' | 'error';

export interface ProcessingStatus {
    stage: ProcessingStage;
    progress: number; // 0-100
    message?: string;
    error?: string;
}

export interface Tag {
    id: string;
    label: string;
    color: string;
}

export interface Flashcard {
    id: string;
    question: string;
    answer: string;
}

export interface QuizOption {
    id: string;
    text: string;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: QuizOption[];
    correctOptionId: string;
    explanation: string;
}

export interface KeyConcept {
    id: string;
    title: string;
    description: string;
    icon?: string;
}

export interface KeyTerm {
    id: string;
    term: string;
    definition: string;
}

export interface TranscriptSegment {
    id: string;
    timestamp: string; // e.g. "00:01:23"
    speaker?: string;
    text: string;
}

export interface LectureContent {
    shortSummary: string;
    detailedSummary: string;
    keyConcepts: KeyConcept[];
    keyTerms: KeyTerm[];
    flashcards: Flashcard[];
    quiz: QuizQuestion[];
    transcript: TranscriptSegment[];
}

export interface Highlight {
    id: string;
    segmentId: string;
    startOffset: number;
    endOffset: number;
    selectedText: string;
    color: string;
    note?: string;
    createdAt: string;
}

export interface Note {
    id: string;
    lectureId: string;
    sectionId?: string;
    content: string;
    position: { x: number; y: number };
    createdAt: string;
    updatedAt: string;
}

export interface Bookmark {
    id: string;
    lectureId: string;
    sectionId: string;
    label: string;
    createdAt: string;
}

export type SubjectFolder = 'AI' | 'Math' | 'Physics' | 'History' | 'Biology' | 'Chemistry' | 'Other';

export interface Lecture {
    id: string;
    title: string;
    description: string;
    subject: SubjectFolder;
    uploadedAt: string;
    duration: string; // e.g. "45:32"
    fileSizeMB: number;
    tags: Tag[];
    confidenceScore: number; // 0-100
    status: ProcessingStage;
    content?: LectureContent;
    highlights: Highlight[];
    notes: Note[];
    bookmarks: Bookmark[];
    s3Key?: string; // AWS S3 object key — set after upload
}
