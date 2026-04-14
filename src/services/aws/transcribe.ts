// ============================================================
// AWS TRANSCRIBE INTEGRATION POINT
// ============================================================
// Current: Returns mock transcript after simulated delay
// Replace: Use AWS SDK to start a TranscriptionJob and poll for results
//   import { TranscribeClient, StartTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
// ============================================================

import type { TranscriptSegment } from '../../types/lecture';

const MOCK_TRANSCRIPT_DELAY_MS = 3000;

/**
 * AWS_INTEGRATION: Replace with Amazon Transcribe job
 * 
 * Real implementation:
 *   1. StartTranscriptionJob with S3 URI as media input
 *   2. Poll GetTranscriptionJob until status is COMPLETED
 *   3. Fetch transcript JSON from the output S3 URI
 *   4. Parse and return the segments
 */
export async function simulateTranscribe(
    s3Key: string,
    onProgress?: (stage: string) => void
): Promise<TranscriptSegment[]> {
    console.log(`[Transcribe] Starting transcription for: ${s3Key}`);

    onProgress?.('Connecting to Amazon Transcribe...');
    await new Promise((r) => setTimeout(r, 1000));

    onProgress?.('Processing audio...');
    await new Promise((r) => setTimeout(r, MOCK_TRANSCRIPT_DELAY_MS));

    onProgress?.('Transcription complete');

    // Mock segments — in production, parse from Transcribe JSON output
    return [
        {
            id: `seg-${Date.now()}-1`,
            timestamp: '00:00:00',
            speaker: 'Speaker 1',
            text: 'Welcome to today\'s lecture. We will be covering the key concepts outlined in the course syllabus.',
        },
        {
            id: `seg-${Date.now()}-2`,
            timestamp: '00:02:30',
            speaker: 'Speaker 1',
            text: 'Let\'s start with the foundational theory before moving to practical applications and worked examples.',
        },
        {
            id: `seg-${Date.now()}-3`,
            timestamp: '00:08:15',
            speaker: 'Speaker 1',
            text: 'The key insight here is that we need to understand the underlying principles, not just memorize formulas.',
        },
    ];
}
