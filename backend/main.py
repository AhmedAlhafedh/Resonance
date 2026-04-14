import os
import json
import logging
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import boto3
from botocore.exceptions import ClientError
from google import genai
from dotenv import load_dotenv
from mangum import Mangum

# Load environment variables from the root .env file
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

# Track jobs currently being analyzed by Gemini
active_analysis_jobs = set()

# Configure logging to console (CloudWatch)
log_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)

logger = logging.getLogger("ResonanceBackend")
logger.setLevel(logging.INFO)
logger.addHandler(console_handler)

app = FastAPI(title="Resonance Local Backend")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

REGION = os.environ.get("AWS_REGION", "eu-central-1")
s3_client = boto3.client('s3', region_name=REGION)
transcribe_client = boto3.client('transcribe', region_name=REGION)

DEFAULT_BUCKET = "resonance-audio-uploads-546515773481-eu-central-1-an"

class PresignRequest(BaseModel):
    filename: str
    bucket: Optional[str] = DEFAULT_BUCKET

class SummarizeRequest(BaseModel):
    transcript: str
    jobId: str
    bucket: Optional[str] = DEFAULT_BUCKET

class PresignResponse(BaseModel):
    url: str
    fields: dict
    jobId: str
    s3Key: str

class SummarizeResponse(BaseModel):
    summary: str
    key_points: List[str]
    topics: List[str]

@app.post("/presign", response_model=PresignResponse)
async def generate_presigned_url(request: PresignRequest):
    """
    Generates a presigned POST URL for the frontend to upload an MP3 directly to S3.
    """
    logger.info(f"[/presign] Request for file: {request.filename}")
    job_id = f"job-{uuid.uuid4().hex[:8]}"
    extension = request.filename.split('.')[-1].lower()
    if extension not in ['mp3', 'wav', 'm4a']:
        extension = 'mp3'
        
    s3_key = f"uploads/{job_id}.{extension}"
    logger.info(f"[/presign] Generated JobID: {job_id}, S3 Key: {s3_key}")
    
    try:
        response = s3_client.generate_presigned_post(
            request.bucket,
            s3_key,
            Fields={"acl": "private", "Content-Type": f"audio/{extension}"},
            Conditions=[
                {"acl": "private"},
                {"Content-Type": f"audio/{extension}"},
                ["content-length-range", 1, 500 * 1024 * 1024]  # 500MB max
            ],
            ExpiresIn=3600
        )
        return PresignResponse(
            url=response['url'],
            fields=response['fields'],
            jobId=job_id,
            s3Key=s3_key
        )
    except AttributeError as e:
        logger.error(f"AWS Credentials Missing: {e}")
        raise HTTPException(status_code=500, detail="Missing AWS credentials. Please set your AWS_ACCESS_KEY_ID in the terminal.")
    except ClientError as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail="Could not generate presigned URL")

async def perform_summarization(job_id: str, bucket: str, transcript_text: str):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is missing")

    try:
        client = genai.Client(api_key=api_key)
        
        prompt = (
            "Analyze the following transcript and return a structured JSON response. "
            "Do NOT return markdown formatting around the JSON (no ```json). Return purely the JSON object.\n"
            "Format:\n"
            "{\n"
            '  "summary": "Full detailed summary text (300-500 words)",\n'
            '  "key_points": ["Major Concept 1", "Major Concept 2"],\n'
            '  "flashcards": [{"question": "Q1", "answer": "A1"}, {"question": "Q2", "answer": "A2"}],\n'
            '  "quiz": [\n'
            '    {\n'
            '      "question": "What is...?",\n'
            '      "options": ["A", "B", "C", "D"],\n'
            '      "correct_answer": "A",\n'
            '      "explanation": "Because..."\n'
            '    }\n'
            '  ],\n'
            '  "topics": ["Term 1", "Term 2"]\n'
            "}\n\n"
            f"Transcript:\n{transcript_text}"
        )
        
        response = client.models.generate_content(
            model='gemini-3-flash-preview',
            contents=prompt,
        )
        
        if not response.text:
            raise ValueError("Gemini returned empty response")
            
        raw_text = response.text.strip()
        if raw_text.startswith('```json'): raw_text = raw_text[7:]
        if raw_text.endswith('```'): raw_text = raw_text[:-3]
        
        result_data = json.loads(raw_text.strip())
        
        # Save results back to S3
        summary_key = f"summaries/{job_id}.json"
        s3_client.put_object(
            Bucket=bucket,
            Key=summary_key,
            Body=json.dumps(result_data).encode('utf-8'),
            ContentType='application/json'
        )
        
        logger.info(f"Summarization complete for {job_id}. Saved to {summary_key}")
        return result_data
        
    except Exception as e:
        logger.error(f"Error in perform_summarization for {job_id}: {str(e)}")
        raise e
    finally:
        if job_id in active_analysis_jobs:
            active_analysis_jobs.remove(job_id)

async def summarize_from_s3(job_id: str, bucket: str):
    """Downloads transcript from S3 and triggers summarization."""
    try:
        transcript_key = f"transcripts/{job_id}.json"
        response = s3_client.get_object(Bucket=bucket, Key=transcript_key)
        data = json.loads(response['Body'].read().decode('utf-8'))
        
        transcript_text = ""
        if "results" in data and "transcripts" in data["results"] and len(data["results"]["transcripts"]) > 0:
            transcript_text = data["results"]["transcripts"][0].get("transcript", "")
            
        if transcript_text:
            await perform_summarization(job_id, bucket, transcript_text)
    except Exception as e:
        logger.error(f"Failed to summarize from S3 for {job_id}: {e}")
        if job_id in active_analysis_jobs:
            active_analysis_jobs.remove(job_id)

@app.post("/summarize")
async def summarize_transcript(request: SummarizeRequest):
    """
    Manual/Lambda trigger for summarization. 
    Can still be used by ngrok/Lambda or called internally.
    """
    if not request.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript cannot be empty")
        
    if request.jobId in active_analysis_jobs:
        return {"status": "Analysis already in progress"}
        
    active_analysis_jobs.add(request.jobId)
    return await perform_summarization(request.jobId, request.bucket, request.transcript)

@app.get("/status/{job_id}")
async def get_job_status(job_id: str, background_tasks: BackgroundTasks, bucket: str = DEFAULT_BUCKET):
    """
    Polls the AWS environment to track whether a lecture is Uploading, Transcribing, Analyzing, or Completed.
    Returns: { "status": "Transcribing", ...data }
    """
    logger.info(f"[/status/{job_id}] Polling check...")
    summary_key = f"summaries/{job_id}.json"
    transcript_key = f"transcripts/{job_id}.json"
    
    # 1. Check if summary exists (Completed stage)
    try:
        logger.debug(f"Checking for summary: {summary_key}")
        response = s3_client.get_object(Bucket=bucket, Key=summary_key)
        summary_data = json.loads(response['Body'].read().decode('utf-8'))
        logger.info(f"[/status/{job_id}] FOUND SUMMARY. Returning Completed.")
        
        # Optionally try to fetch transcript to return both
        transcript_text = ""
        try:
            t_res = s3_client.get_object(Bucket=bucket, Key=transcript_key)
            t_data = json.loads(t_res['Body'].read().decode('utf-8'))
            transcript_text = t_data.get('results', {}).get('transcripts', [{}])[0].get('transcript', '')
        except ClientError:
            pass
            
        return {
            "status": "Completed", 
            "summary": summary_data.get('summary', ''),
            "key_points": summary_data.get('key_points', []),
            "flashcards": summary_data.get('flashcards', []),
            "quiz": summary_data.get('quiz', []),
            "topics": summary_data.get('topics', []),
            "transcript": transcript_text
        }
    except ClientError as e:
        code = e.response['Error']['Code']
        if code not in ['NoSuchKey', '404']:
            logger.error(f"S3 Error checking summary: {code}")
            raise HTTPException(status_code=500, detail=str(e))
            
    # 2. Check if transcript exists but no summary yet (Analyzing stage)
    try:
        logger.debug(f"Checking for transcript: {transcript_key}")
        s3_client.head_object(Bucket=bucket, Key=transcript_key)
        
        # TRANSCRIPT EXISTS! Now check if we should trigger summarization locally
        if job_id not in active_analysis_jobs:
            logger.info(f"[/status/{job_id}] FOUND TRANSCRIPT. Triggering local analysis.")
            active_analysis_jobs.add(job_id)
            background_tasks.add_task(summarize_from_s3, job_id, bucket)
            
        return {"status": "Analyzing"}
        
    except ClientError as e:
        code = e.response['Error']['Code']
        if code not in ['NoSuchKey', '404']:
            logger.error(f"S3 Error checking transcript: {code}")
            raise HTTPException(status_code=500, detail=str(e))
            
    # 3. Check AWS Transcribe status (Transcribing stage)
    try:
        logger.debug(f"Checking Transcribe Job: {job_id}")
        response = transcribe_client.get_transcription_job(TranscriptionJobName=job_id)
        status_val = response['TranscriptionJob']['TranscriptionJobStatus']
        logger.info(f"[/status/{job_id}] Transcribe Status: {status_val}")
        if status_val in ['IN_PROGRESS', 'QUEUED']:
            return {"status": "Transcribing"}
        elif status_val == 'COMPLETED':
            return {"status": "Analyzing"}
        else:
            return {"status": f"Failed: Transcribe job status {status_val}"}
    except ClientError as e:
        code = e.response['Error']['Code']
        
        # TRANSCRIPTION JOB NOT FOUND! Let's help AWS start it.
        if code in ['BadRequestException', 'NotFound']:
            logger.info(f"[/status/{job_id}] Transcribe job missing. Checking S3 for auto-trigger...")
            try:
                res = s3_client.list_objects_v2(Bucket=bucket, Prefix=f"uploads/{job_id}")
                if 'Contents' in res:
                    actual_key = res['Contents'][0]['Key']
                    logger.info(f"[/status/{job_id}] FOUND file {actual_key}. Starting Transcribe NATIVELY.")
                    
                    media_format = actual_key.split('.')[-1].lower()
                    transcribe_client.start_transcription_job(
                        TranscriptionJobName=job_id,
                        Media={'MediaFileUri': f"s3://{bucket}/{actual_key}"},
                        MediaFormat=media_format,
                        IdentifyLanguage=True,
                        OutputBucketName=bucket,
                        OutputKey=f"transcripts/{job_id}.json"
                    )
                    return {"status": "Transcribing", "detail": "Starting Transcribe..."}
            except Exception as trigger_err:
                logger.error(f"Failed to auto-trigger Transcribe for {job_id}: {trigger_err}")
                
        # 4. FUZZY MATCHING (Legacy Support)
        # If we still haven't found a job, check if a RECENT transcript exists that we can "adopt"
        try:
            res = s3_client.list_objects_v2(Bucket=bucket, Prefix="transcripts/job-177")
            if 'Contents' in res:
                # Get most recent transcript
                latest = sorted(res['Contents'], key=lambda x: x['LastModified'], reverse=True)[0]
                # If created in the last 2 minutes, it's likely the "mismatched" one
                import time
                from datetime import timezone
                if (datetime.now(timezone.utc) - latest['LastModified']).total_seconds() < 120:
                    legacy_id = latest['Key'].split('/')[-1].split('.')[0]
                    logger.warning(f"[/status/{job_id}] Detected recent legacy transcript {legacy_id}. ADOPTING.")
                    background_tasks.add_task(summarize_from_s3, legacy_id, bucket)
                    return {"status": "Analyzing", "detail": "Adopting legacy transcript..."}
        except:
            pass

        logger.info(f"[/status/{job_id}] Nothing found for JobID. Status: Uploading")
        return {"status": "Uploading"}

@app.get("/")
def read_root():
    return {"message": "Resonance Backend API is running properly. Use the React frontend to upload lectures."}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Lambda Handler for AWS
handler = Mangum(app)
