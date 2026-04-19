import boto3
from dotenv import load_dotenv
load_dotenv()
try:
    transcribe = boto3.client('transcribe', region_name='eu-central-1')
    status = transcribe.get_transcription_job(TranscriptionJobName='job-a351e1c1')
    print("STATUS:", status['TranscriptionJob']['TranscriptionJobStatus'])
except Exception as e:
    print("ERROR:", e)
