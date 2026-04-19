import boto3
import os
from dotenv import load_dotenv

load_dotenv()

session = boto3.Session(
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
    region_name='eu-central-1'
)

def check_resources():
    try:
        # Check Lambda
        lambda_client = session.client('lambda')
        functions = lambda_client.list_functions()
        print("--- Lambda Functions ---")
        for f in functions.get('Functions', []):
            print(f"- {f['FunctionName']}")
            
        # Check S3
        s3 = session.client('s3')
        buckets = s3.list_buckets()
        print("\n--- S3 Buckets ---")
        for b in buckets.get('Buckets', []):
            print(f"- {b['Name']}")
            
    except Exception as e:
        print(f"Error checking AWS resources: {e}")

if __name__ == "__main__":
    check_resources()
