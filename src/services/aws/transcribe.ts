export async function simulateTranscribe(
    s3Uri: string, // Use full S3 URI: s3://bucket-name/key
    onProgress?: (stage: string) => void
): Promise<TranscriptSegment[]> {
    const jobName = `transcription-${Date.now()}`;

    // 1. Start the Transcription Job
    onProgress?.('Starting Amazon Transcribe job...');
    await transcribeClient.send(new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        Media: { MediaFileUri: s3Uri },
        IdentifyLanguage: true, // Or specify LanguageCode: "en-US"
    }));

    // 2. Poll for Completion
    let status = 'IN_PROGRESS';
    let transcriptUri = '';

    while (status === 'IN_PROGRESS' || status === 'QUEUED') {
        onProgress?.('Processing audio...');
        await new Promise(r => setTimeout(r, 5000)); // Poll every 5 seconds

        const { TranscriptionJob } = await transcribeClient.send(
            new GetTranscriptionJobCommand({ TranscriptionJobName: jobName })
        );

        status = TranscriptionJob?.TranscriptionJobStatus || 'FAILED';
        transcriptUri = TranscriptionJob?.Transcript?.TranscriptFileUri || '';

        if (status === 'FAILED') throw new Error('Transcription job failed');
    }

    // 3. Fetch and Parse Transcript Safely
    onProgress?.('Finalizing transcript...');
    const response = await fetch(transcriptUri);
    
    // Safety check to prevent "Unexpected end of JSON input"
    const text = await response.text();
    if (!text) throw new Error("Transcript file is empty");

    const rawData = JSON.parse(text);

    // 4. Map AWS JSON to your TranscriptSegment type
    return rawData.results.items.map((item: any, index: number) => ({
        id: `seg-${index}`,
        timestamp: item.start_time || '00:00:00',
        speaker: item.speaker_label || 'Speaker 1',
        text: item.alternatives[0].content,
    }));
}
