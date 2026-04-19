import boto3

client = boto3.client('s3', region_name='eu-central-1')
cors_configuration = {
    'CORSRules': [{
        'AllowedHeaders': ['*'],
        'AllowedMethods': ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        'AllowedOrigins': ['*'], # OR 'http://localhost:5173'
        'ExposeHeaders': ['ETag']
    }]
}

try:
    client.put_bucket_cors(
        Bucket='resonance-audio-uploads-546515773481-eu-central-1-an', 
        CORSConfiguration=cors_configuration
    )
    print("S3 CORS policy added successfully!")
except Exception as e:
    print(f"Error: {e}")
