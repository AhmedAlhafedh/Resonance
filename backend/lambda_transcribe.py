import json
import os
import boto3
import urllib.parse

transcribe_client = boto3.client('transcribe')

def lambda_handler(event, context):
    try:
        # Get the bucket and file name from the event
        bucket = event['Records'][0]['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'])
        
        # Ensure it's in the uploads/ directory
        if not key.startswith('uploads/'):
            print(f"Skipping key {key} (not in uploads/)")
            return
            
        filename = key.split('/')[-1] # "job-12345.mp3"
        job_id = filename.split('.')[0] # "job-12345"
        
        media_uri = f"s3://{bucket}/{key}"
        output_key = f"transcripts/{job_id}.json"
        
        # Media format inferred from extension
        media_format = filename.split('.')[-1].lower()
        if media_format not in ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'amr', 'webm', 'mp4']:
            media_format = 'mp3' # Default
            
        print(f"Starting transcription job: {job_id} for {media_uri}")
        
        response = transcribe_client.start_transcription_job(
            TranscriptionJobName=job_id,
            Media={'MediaFileUri': media_uri},
            MediaFormat=media_format,
            IdentifyLanguage=True, # Auto-detect English, etc.
            OutputBucketName=bucket,
            OutputKey=output_key,
        )
        
        print("Successfully started transcription job.")
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Transcription job started', 'jobId': job_id})
        }
    except Exception as e:
        print(f"Error starting transcription job: {str(e)}")
        raise e
