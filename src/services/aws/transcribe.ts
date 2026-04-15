import { 
    TranscribeClient, 
    StartTranscriptionJobCommand, 
    GetTranscriptionJobCommand 
} from '@aws-sdk/client-transcribe';
import type { TranscriptSegment } from '../../types/lecture';

// Initialize the Transcribe Client
// Note: Ensure your environment variables (AWS_ACCESS_KEY_ID, etc.) are configured
const transcribeClient = new TranscribeClient({ 
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1' 
});

/**
 * Production Transcribe implementation
 * 1. Starts a job in AWS
 * 2. Polls for completion
 * 3. Safely fetches and parses the resulting JSON
 */
export async function simulateTranscribe(
    s3Uri: string, 
    onProgress?: (stage: string) => void
): Promise<TranscriptSegment[]> {
    const jobName = `transcription-${Date.now()}`;

    try {
        // 1. Start the Transcription Job
        onProgress?.('Starting Amazon Transcribe job...');
        await transcribeClient.send(new StartTranscriptionJobCommand({
            TranscriptionJobName: jobName,
            Media: { MediaFileUri: s3Uri },
            IdentifyLanguage: true, 
        }));

        // 2. Poll for Completion
        let status = 'IN_PROGRESS';
        let transcriptUri = '';

        while (status === 'IN_PROGRESS' || status === 'QUEUED') {
            onProgress?.('Processing audio (this may take a few minutes)...');
            
            // Wait 5 seconds between polls
            await new Promise(r => setTimeout(r, 5000)); 

            const { TranscriptionJob } = await transcribeClient.send(
                new GetTranscriptionJobCommand({ TranscriptionJobName: jobName })
            );

            status = TranscriptionJob?.TranscriptionJobStatus || 'FAILED';
            transcriptUri = TranscriptionJob?.Transcript?.TranscriptFileUri || '';

            if (status === 'FAILED') {
                throw new Error(`Transcription job failed with status: ${status}`);
            }
        }

        // 3. Fetch and Parse Transcript Safely
        onProgress?.('Finalizing transcript...');
        const response = await fetch(transcriptUri);
        
        // This 'text' check prevents the "Unexpected end of JSON input" error
        const text = await response.text();
        if (!text) {
            throw new Error("The transcript file returned from S3 was empty.");
        }

        const rawData = JSON.parse(text);

        // 4. Map AWS JSON format to your local TranscriptSegment type
        // Adjust the mapping below based on the exact shape of your AWS JSON output
        return rawData.results.items.map((item: any, index: number) => ({
            id: `seg-${index}-${Date.now()}`,
            timestamp: item.start_time || '00:00:00',
            speaker: item.speaker_label || 'Speaker 1',
            text: item.alternatives?.[0]?.content || '',
        }));

    } catch (error) {
        console.error("[Transcribe Error]:", error);
        onProgress?.('Error during transcription');
        throw error;
    }
}
