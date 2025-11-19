import json
import os
from datetime import datetime

# Local JSON file path (stored on user's device)
LOCAL_FILE = "local_user_data.json"


def load_local_data():
    """Load existing local data or create an empty structure."""
    if not os.path.exists(LOCAL_FILE):
        return {"interactions": []}

    try:
        with open(LOCAL_FILE, "r") as f:
            return json.load(f)
    except json.JSONDecodeError:
        # Corrupted file → rebuild
        return {"interactions": []}


def save_local_data(data):
    """Save updated user interaction data back to the JSON file."""
    with open(LOCAL_FILE, "w") as f:
        json.dump(data, f, indent=4)


def store_user_interaction(headline, category, read_more_clicks=0,
                           reddit_clicks=0, total_watch_time=0,
                           watch_sessions=0):
    """
    Store user interaction in the same format as MongoDB.
    
    This function is called every time user interacts
    (read more, reddit click, watch time, etc.)
    """

    data = load_local_data()

    entry = {
        "headline": headline,
        "category": category,
        "created_at": datetime.now().isoformat(),
        "read_more_clicks": read_more_clicks,
        "reddit_clicks": reddit_clicks,
        "total_watch_time": total_watch_time,
        "watch_sessions": watch_sessions
    }

    data["interactions"].append(entry)
    save_local_data(data)

    print(f"[LOCAL STORAGE] Saved: {headline}")
