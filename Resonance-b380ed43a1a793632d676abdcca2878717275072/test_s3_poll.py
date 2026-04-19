import boto3
import os
from dotenv import load_dotenv

load_dotenv()

s3 = boto3.client('s3', region_name='eu-central-1')
bucket = 'resonance-audio-uploads-546515773481-eu-central-1-an'

def trace_file():
    # 1. Check all uploads
    print("--- UPLOADS ---")
    res = s3.list_objects_v2(Bucket=bucket, Prefix='uploads/')
    jobs = []
    job_id_for_test = None
    for obj in res.get('Contents', []):
        print(obj['Key'])
        # uploads/job-abcd.mp3
        if "job-" in obj['Key']:
            job_id = obj['Key'].split('/')[-1].split('.')[0]
            jobs.append(job_id)
            
    # Assuming the most recent job is the one we want to track
    jobs.sort(reverse=True)
    if jobs:
        latest = jobs[0]
        print(f"\n--- TRACKING LATEST JOB: {latest} ---")
        
        print("\n--- TRANSCRIPTS ---")
        try:
            s3.head_object(Bucket=bucket, Key=f"transcripts/{latest}.json")
            print(f"FOUND: transcripts/{latest}.json")
        except Exception as e:
            print(f"NOT FOUND: transcripts/{latest}.json ({e})")
            
        print("\n--- SUMMARIES ---")
        try:
            s3.head_object(Bucket=bucket, Key=f"summaries/{latest}.json")
            print(f"FOUND: summaries/{latest}.json")
        except Exception as e:
            print(f"NOT FOUND: summaries/{latest}.json ({e})")

trace_file()
