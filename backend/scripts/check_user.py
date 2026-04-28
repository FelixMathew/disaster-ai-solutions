from pathlib import Path
import sys
project_root = str(Path(__file__).resolve().parents[1])
if project_root not in sys.path:
    sys.path.insert(0, project_root)
from app import database
email = "proxy-test2@example.com"
docs = list(database.users_collection.find({"email": email}))
print('FOUND', len(docs))
for d in docs:
    print(d)
