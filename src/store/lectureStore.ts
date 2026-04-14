import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Lecture, Highlight, Note, ProcessingStatus, SubjectFolder } from '../types/lecture';
import { DUMMY_LECTURES } from '../data/dummyData';

interface LectureStore {
    // Data
    lectures: Lecture[];
    activeLectureId: string | null;
    processingStatus: ProcessingStatus;
    recentlyOpenedIds: string[];

    // Computed (to be handled by selectors in components)
    // activeLecture: Lecture | null;

    // Lecture management
    setActiveLecture: (id: string) => void;
    addLecture: (lecture: Lecture) => void;
    updateLecture: (id: string, updates: Partial<Lecture>) => void;
    deleteLecture: (id: string) => void;

    // Processing pipeline
    setProcessingStatus: (status: ProcessingStatus) => void;
    resetProcessingStatus: () => void;

    // Highlights
    addHighlight: (lectureId: string, highlight: Omit<Highlight, 'id' | 'createdAt'>) => void;
    removeHighlight: (lectureId: string, highlightId: string) => void;
    updateHighlightNote: (lectureId: string, highlightId: string, note: string) => void;

    // Notes
    addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateNote: (noteId: string, content: string) => void;
    removeNote: (lectureId: string, noteId: string) => void;

    // Bookmarks
    toggleBookmark: (lectureId: string, sectionId: string, label: string) => void;

    // Subject content editing
    updateContent: (lectureId: string, field: string, value: string) => void;

    // Bulk actions
    clearAllLectures: () => void;
}

const INITIAL_STATUS: ProcessingStatus = { stage: 'idle', progress: 0 };

export const useLectureStore = create<LectureStore>()(
    persist(
        (set) => ({
            lectures: DUMMY_LECTURES,
            activeLectureId: DUMMY_LECTURES.length > 0 ? DUMMY_LECTURES[0].id : null,
            processingStatus: INITIAL_STATUS,
            recentlyOpenedIds: DUMMY_LECTURES.slice(0, 2).map(l => l.id),

            setActiveLecture: (id) => {
                set((state) => ({
                    activeLectureId: id,
                    recentlyOpenedIds: [id, ...state.recentlyOpenedIds.filter((r) => r !== id)].slice(0, 5),
                }));
            },

            addLecture: (lecture) => {
                set((state) => {
                    const exists = state.lectures.some(l => l.id === lecture.id);
                    if (exists) {
                        return {
                            lectures: state.lectures.map(l => l.id === lecture.id ? { ...l, ...lecture } : l),
                            activeLectureId: lecture.id
                        };
                    }
                    return {
                        lectures: [lecture, ...state.lectures],
                        activeLectureId: lecture.id,
                        recentlyOpenedIds: [lecture.id, ...state.recentlyOpenedIds.filter(id => id !== lecture.id)].slice(0, 5),
                    };
                });
            },

            updateLecture: (id, updates) => {
                set((state) => ({
                    lectures: state.lectures.map((l) => (l.id === id ? { ...l, ...updates } : l)),
                }));
            },

            deleteLecture: (id) => {
                set((state) => {
                    const filtered = state.lectures.filter((l) => l.id !== id);
                    return {
                        lectures: filtered,
                        activeLectureId: state.activeLectureId === id ? (filtered[0]?.id ?? null) : state.activeLectureId,
                    };
                });
            },

            setProcessingStatus: (status) => set({ processingStatus: status }),
            resetProcessingStatus: () => set({ processingStatus: INITIAL_STATUS }),

            addHighlight: (lectureId, highlight) => {
                const newHighlight: Highlight = {
                    ...highlight,
                    id: uuidv4(),
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    lectures: state.lectures.map((l) =>
                        l.id === lectureId ? { ...l, highlights: [...l.highlights, newHighlight] } : l
                    ),
                }));
            },

            removeHighlight: (lectureId, highlightId) => {
                set((state) => ({
                    lectures: state.lectures.map((l) =>
                        l.id === lectureId
                            ? { ...l, highlights: l.highlights.filter((h) => h.id !== highlightId) }
                            : l
                    ),
                }));
            },

            updateHighlightNote: (lectureId, highlightId, note) => {
                set((state) => ({
                    lectures: state.lectures.map((l) =>
                        l.id === lectureId
                            ? {
                                ...l,
                                highlights: l.highlights.map((h) => (h.id === highlightId ? { ...h, note } : h)),
                            }
                            : l
                    ),
                }));
            },

            addNote: (noteData) => {
                const note: Note = {
                    ...noteData,
                    id: uuidv4(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };
                set((state) => ({
                    lectures: state.lectures.map((l) =>
                        l.id === noteData.lectureId ? { ...l, notes: [...l.notes, note] } : l
                    ),
                }));
            },

            updateNote: (noteId, content) => {
                set((state) => ({
                    lectures: state.lectures.map((l) => ({
                        ...l,
                        notes: l.notes.map((n) =>
                            n.id === noteId ? { ...n, content, updatedAt: new Date().toISOString() } : n
                        ),
                    })),
                }));
            },

            removeNote: (lectureId, noteId) => {
                set((state) => ({
                    lectures: state.lectures.map((l) =>
                        l.id === lectureId ? { ...l, notes: l.notes.filter((n) => n.id !== noteId) } : l
                    ),
                }));
            },

            toggleBookmark: (lectureId, sectionId, label) => {
                set((state) => {
                    const lecture = state.lectures.find((l) => l.id === lectureId);
                    if (!lecture) return state;
                    const existing = lecture.bookmarks.find((b) => b.sectionId === sectionId);
                    const updatedBookmarks = existing
                        ? lecture.bookmarks.filter((b) => b.sectionId !== sectionId)
                        : [...lecture.bookmarks, { id: uuidv4(), lectureId, sectionId, label, createdAt: new Date().toISOString() }];
                    return {
                        lectures: state.lectures.map((l) =>
                            l.id === lectureId ? { ...l, bookmarks: updatedBookmarks } : l
                        ),
                    };
                });
            },

            updateContent: (lectureId, field, value) => {
                set((state) => ({
                    lectures: state.lectures.map((l) =>
                        l.id === lectureId ? { ...l, content: l.content ? { ...l.content, [field]: value } : l.content } : l
                    ),
                }));
            },

            clearAllLectures: () => {
                set({
                    lectures: [],
                    activeLectureId: null,
                    recentlyOpenedIds: [],
                });
            },
        }),
        {
            name: 'resonance-lectures',
            partialize: (state) => ({
                lectures: state.lectures,
                activeLectureId: state.activeLectureId,
                recentlyOpenedIds: state.recentlyOpenedIds,
            }),
        }
    )
);

// UI Store — filter/search/sidebar state
interface UIStore {
    sidebarCollapsed: boolean;
    searchQuery: string;
    activeTab: string;
    uploadModalOpen: boolean;
    filterSubject: SubjectFolder | 'All';
    filterDateRange: '7d' | '30d' | '90d' | 'all';
    expandedFolders: SubjectFolder[];

    setSidebarCollapsed: (v: boolean) => void;
    setSearchQuery: (q: string) => void;
    setActiveTab: (tab: string) => void;
    setUploadModalOpen: (open: boolean) => void;
    setFilterSubject: (subject: SubjectFolder | 'All') => void;
    setFilterDateRange: (range: '7d' | '30d' | '90d' | 'all') => void;
    toggleFolder: (folder: SubjectFolder) => void;
}

export const useUIStore = create<UIStore>()(
    persist(
        (set) => ({
            sidebarCollapsed: false,
            searchQuery: '',
            activeTab: 'summary',
            uploadModalOpen: false,
            filterSubject: 'All',
            filterDateRange: 'all',
            expandedFolders: ['AI', 'Math', 'Physics'],

            setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
            setSearchQuery: (q) => set({ searchQuery: q }),
            setActiveTab: (tab) => set({ activeTab: tab }),
            setUploadModalOpen: (open) => set({ uploadModalOpen: open }),
            setFilterSubject: (filterSubject) => set({ filterSubject }),
            setFilterDateRange: (filterDateRange) => set({ filterDateRange }),
            toggleFolder: (folder) =>
                set((state) => ({
                    expandedFolders: state.expandedFolders.includes(folder)
                        ? state.expandedFolders.filter((f) => f !== folder)
                        : [...state.expandedFolders, folder],
                })),
        }),
        { name: 'resonance-ui' }
    )
);
