import json
import urllib.request

payload = {"username": "cliuser", "email": "cli-cli@example.com", "password": "password123"}
req = urllib.request.Request(
    'http://127.0.0.1:8000/register',
    data=json.dumps(payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
try:
    with urllib.request.urlopen(req) as resp:
        print('STATUS', resp.status)
        print(resp.read().decode())
except Exception as e:
    print('REQUEST ERROR', e)

# check DB
try:
    import sys
    from pathlib import Path
    project_root = str(Path(__file__).resolve().parents[1])
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    from app import database
    docs = list(database.users_collection.find({"email": "cli-cli@example.com"}))
    print('DB FOUND', len(docs))
    for d in docs:
        print(d)
except Exception as e:
    print('DB ERROR', e)
