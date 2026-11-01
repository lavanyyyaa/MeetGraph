import sqlite3
import os
from typing import Dict, Any, List, Optional
import json

DB_FILE = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "..", "data", "meetgraph.db"))

_initialized = False
def init_db():
    global _initialized
    os.makedirs(os.path.dirname(os.path.abspath(DB_FILE)), exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        transcript TEXT NOT NULL,
        meeting_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        owner TEXT DEFAULT 'Unknown',
        deadline TEXT,
        deadline_raw TEXT,
        status TEXT DEFAULT 'TODO',
        source_sentence TEXT NOT NULL,
        confidence REAL DEFAULT 0.85,
        risk_label TEXT DEFAULT 'LOW',
        priority_score REAL DEFAULT 0.0,
        gnn_risk_prob REAL,
        gnn_risk_label TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (meeting_id) REFERENCES meetings (id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dependencies (
        id TEXT PRIMARY KEY,
        meeting_id TEXT NOT NULL,
        source_task_id TEXT NOT NULL,
        target_task_id TEXT NOT NULL,
        relation_type TEXT DEFAULT 'DEPENDS_ON',
        evidence_sentence TEXT NOT NULL,
        confidence REAL DEFAULT 0.80,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (meeting_id) REFERENCES meetings (id) ON DELETE CASCADE,
        FOREIGN KEY (source_task_id) REFERENCES tasks (id) ON DELETE CASCADE,
        FOREIGN KEY (target_task_id) REFERENCES tasks (id) ON DELETE CASCADE
    );
    """)
    conn.commit()
    conn.close()
    _initialized = True

def get_db_connection():
    global _initialized
    if not _initialized:
        init_db()
    os.makedirs(os.path.dirname(os.path.abspath(DB_FILE)), exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at", DB_FILE)
