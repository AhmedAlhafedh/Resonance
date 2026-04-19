import urllib.request
import urllib.error
import json

req = urllib.request.Request(
    'http://localhost:8000/summarize',
    data=json.dumps({'transcript': 'The mitochondria is the powerhouse of the cell.', 'jobId': 'job-manual-test-123', 'bucket': 'resonance-audio-uploads-546515773481-eu-central-1-an'}).encode(),
    headers={'Content-Type': 'application/json'}
)
try:
    res = urllib.request.urlopen(req)
    print("SUCCESS", res.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP ERROR", e.code)
    print(e.read().decode())
