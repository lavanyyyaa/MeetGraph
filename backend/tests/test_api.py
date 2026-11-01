import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_process_transcript_and_graph_workflow():
    payload = {
        "title": "API Test Standup",
        "transcript": (
            "Riya will complete the UI by Friday. "
            "However, she cannot finish it until Arjun completes the API integration. "
            "Arjun is waiting for the database team to finalize the schema by Wednesday. "
            "Testing will begin once the UI and API are ready."
        )
    }
    # 1. Process transcript
    response = client.post("/api/transcripts/process", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    meeting_id = data["id"]
    assert len(data["tasks"]) >= 3
    assert len(data["dependencies"]) >= 3

    # 2. Retrieve meeting
    get_res = client.get(f"/api/meetings/{meeting_id}")
    assert get_res.status_code == 200

    # 3. Retrieve graph
    graph_res = client.get(f"/api/meetings/{meeting_id}/graph")
    assert graph_res.status_code == 200
    graph_data = graph_res.json()
    assert len(graph_data["nodes"]) > 0
    assert len(graph_data["edges"]) > 0

    # 4. Retrieve recommendations
    recs_res = client.get(f"/api/meetings/{meeting_id}/recommendations")
    assert recs_res.status_code == 200
    recs = recs_res.json()["recommendations"]
    assert len(recs) > 0
    assert "downstream_impact_count" in recs[0]

    # 5. Retrieve ML evaluation report
    ml_res = client.get("/api/ml/evaluation")
    assert ml_res.status_code == 200
    assert ml_res.json()["is_trained"] is True
