export interface UploadResult {
    s3Key: string;
    bucket: string;
    url: string;
    jobId: string;
}

export async function uploadToS3(
    file: File,
    onProgress: (progress: number) => void
): Promise<UploadResult> {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    
    // 1. Get Presigned URL from FastAPI
    const presignRes = await fetch(`${backendUrl}/presign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name })
    });
    
    const responseText = await presignRes.text();
    
    if (!presignRes.ok) {
        let errorDetail = '';
        try {
            const errData = JSON.parse(responseText);
            errorDetail = errData.detail || errData.message || '';
        } catch {
            errorDetail = responseText;
        }
        throw new Error(`Failed to get presigned URL (${presignRes.status}): ${errorDetail || presignRes.statusText}`);
    }
    
    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        console.error('[S3] Failed to parse JSON response:', responseText);
        throw new Error(`Invalid JSON response from backend: ${responseText.slice(0, 100)}...`);
    }

    const { url, fields, jobId, s3Key } = data;
    
    // 2. Upload file via presigned POST using XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        Object.keys(fields).forEach(key => formData.append(key, fields[key]));
        formData.append('file', file);
        
        const xhr = new XMLHttpRequest();
        
        console.log('[S3-XHR] Starting upload to:', url, 'with key:', s3Key);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                console.debug(`[S3-XHR] Progress: ${percentComplete}%`);
                onProgress(percentComplete);
            }
        };
        
        xhr.onload = () => {
            console.log(`[S3-XHR] Response received: ${xhr.status} ${xhr.statusText}`);
            if (xhr.status >= 200 && xhr.status < 300) {
                console.log('[S3-XHR] Upload succeeded!');
                resolve({
                    s3Key,
                    jobId,
                    bucket: 'resonance-audio-uploads-546515773481-eu-central-1-an',
                    url: `${url}/${s3Key}`
                });
            } else {
                console.error('[S3-XHR] Upload failed body:', xhr.responseText);
                reject(new Error(`S3 Upload failed: ${xhr.status} ${xhr.statusText}`));
            }
        };
        
        xhr.onerror = () => {
            console.error('[S3-XHR] Network error during upload');
            reject(new Error('S3 Upload failed network error'));
        };
        
        xhr.open('POST', url, true);
        xhr.send(formData);
    });
}
