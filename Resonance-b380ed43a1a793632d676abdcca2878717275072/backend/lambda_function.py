import json
import os
import urllib.request
import urllib.error
import urllib.parse
import boto3

s3_client = boto3.client('s3')

def lambda_handler(event, context):
    try:
        # Expected to be triggered by S3 ObjectCreated event
        if 'Records' not in event:
            print("No Records found in event.")
            return

        record = event['Records'][0]
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])
        
        print(f"Triggered for bucket: {bucket}, key: {key}")
        
        if not key.endswith('.json'):
            print(f"Skipping non-json file: {key}")
            return
            
        # Extract jobId (e.g., transcripts/job-123.json -> job-123)
        job_id = key.split('/')[-1].split('.')[0]

        # 1. Fetch transcript from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        file_content = response['Body'].read().decode('utf-8')
            
        # 2. Parse JSON transcript
        data = json.loads(file_content)
        transcript_text = ""
        if "results" in data and "transcripts" in data["results"] and len(data["results"]["transcripts"]) > 0:
            transcript_text = data["results"]["transcripts"][0].get("transcript", "")
        
        if not transcript_text:
            print("Warning: Parsed transcript text is empty.")
            
        print(f"Parsed transcript length: {len(transcript_text)}")
            
        # 3. Read BACKEND_API_URL
        api_url = os.environ.get('BACKEND_API_URL')
        if not api_url:
            print("Error: BACKEND_API_URL environment variable is missing")
            return
            
        target_url = api_url.rstrip('/') + '/summarize'
        
        # 4. POST to FastAPI
        payload_data = {
            'transcript': transcript_text,
            'jobId': job_id,
            'bucket': bucket
        }
        
        payload = json.dumps(payload_data).encode('utf-8')
        req = urllib.request.Request(
            target_url,
            data=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        # Retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # 120s timeout since Gemini can take a moment
                with urllib.request.urlopen(req, timeout=120) as res:
                    resp_body = res.read().decode('utf-8')
                    print(f"Successfully sent to FastAPI. Response: {resp_body}")
                    return
            except urllib.error.HTTPError as e:
                error_msg = e.read().decode('utf-8')
                print(f"Attempt {attempt+1}/{max_retries} - HTTPError: {e.code} - {error_msg}")
            except urllib.error.URLError as e:
                print(f"Attempt {attempt+1}/{max_retries} - URLError: {str(e)}")
                
    except Exception as e:
        print(f"Unhandled Exception: {str(e)}")
        raise e
