import urllib.request
import urllib.error
import json

req = urllib.request.Request(
    'http://localhost:8000/presign',
    data=json.dumps({'filename': 'test.mp3', 'bucket': 'resonance-audio-uploads-546515773481-eu-central-1-an'}).encode(),
    headers={'Content-Type': 'application/json'}
)
try:
    res = urllib.request.urlopen(req)
    print(res.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print(e.read().decode())
