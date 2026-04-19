import { v4 as uuidv4 } from 'uuid';
import type { LectureContent, Tag } from '../types/lecture';

/**
 * Maps raw backend response data into structured LectureContent.
 * Ensures that missing fields are gracefully handled with defaults.
 */
export function mapBackendResponseToContent(data: any): LectureContent {
    console.log('[DATA-MAPPER] Transforming raw backend data:', data);

    // 1. Map Transcript
    const transcript = data.transcript 
        ? [{ id: uuidv4(), timestamp: '00:00', text: data.transcript, speaker: 'Speaker' }]
        : [];

    // 2. Map Summary
    const detailedSummary = data.summary || '';
    const shortSummary = detailedSummary 
        ? detailedSummary.split('. ').slice(0, 2).join('. ') + '.' 
        : '';

    // 3. Map Concepts
    const keyConcepts = (data.key_points || []).map((kp: string) => ({
        id: uuidv4(),
        title: kp,
        description: 'Key takeaway extracted by AI.'
    }));

    // 4. Map Terms (Topics)
    const keyTerms = (data.topics || []).map((t: string) => ({
        id: uuidv4(),
        term: t,
        definition: 'Subject identified in the lecture.'
    }));

    // 5. Map Flashcards
    const flashcards = (data.flashcards || []).map((f: any) => ({
        id: uuidv4(),
        question: f.question || 'Missing question?',
        answer: f.answer || 'Missing answer?'
    }));

    // 6. Map Quiz
    const quiz = (data.quiz || []).map((q: any) => {
        const questionId = uuidv4();
        const options = (q.options || []).map((opt: string) => ({
            id: uuidv4(),
            text: opt
        }));

        // Find which option matches the correct answer string
        const correctText = q.correct_answer || '';
        const match = options.find((opt: any) => opt.text === correctText);

        return {
            id: questionId,
            question: q.question || 'No question text available.',
            options: options,
            correctOptionId: match?.id || (options[0]?.id || ''),
            explanation: q.explanation || 'Analyzed automatically.'
        };
    });

    const result = {
        shortSummary,
        detailedSummary,
        keyConcepts,
        keyTerms,
        flashcards,
        quiz,
        transcript
    };

    console.log('[DATA-MAPPER] Final mapped content:', result);
    return result;
}

/**
 * Maps topics strings to Tag objects
 */
export function mapTopicsToTags(topics: string[]): Tag[] {
    return (topics || []).map((t: string) => ({
        id: uuidv4(),
        label: t,
        color: 'bg-accent/10 text-accent'
    }));
}
