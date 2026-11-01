import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
import networkx as nx

from ..schemas import (
    MeetingResponse, MeetingCreate, TaskResponse, TaskUpdate, TaskCreate,
    DependencyResponse, DependencyCreate, GraphDataResponse,
    PriorityRecommendationResponse, ModelEvaluationComparison
)
from ..database import get_db_connection
from ..nlp.pipeline import NLPPipeline
from ..graph.builder import build_networkx_graph, serialize_graph_for_ui
from ..graph.analysis import (
    extract_task_subgraph, detect_cycles, find_critical_dependency_chains,
    compute_task_network_metrics
)
from ..graph.priority_engine import generate_recommendations, calculate_rule_priority
from ..ml.evaluator import run_gnn_inference_on_tasks, load_evaluation_report
from ..ml.train import train_and_evaluate

router = APIRouter()
nlp_pipeline = NLPPipeline()

def fetch_meeting_full(meeting_id: str) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM meetings WHERE id = ?", (meeting_id,))
    meet_row = cursor.fetchone()
    if not meet_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Meeting not found")

    meeting = dict(meet_row)

    cursor.execute("SELECT * FROM tasks WHERE meeting_id = ?", (meeting_id,))
    tasks = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM dependencies WHERE meeting_id = ?", (meeting_id,))
    dependencies = [dict(r) for r in cursor.fetchall()]

    conn.close()

    # Reconstruct graph for metrics
    G_full = build_networkx_graph(tasks, dependencies, include_auxiliary_nodes=True)
    G_tasks = extract_task_subgraph(G_full)
    has_cycle, cycles = detect_cycles(G_tasks)
    metrics_map = compute_task_network_metrics(G_tasks)

    for t in tasks:
        t_id = t["id"]
        t_metrics = metrics_map.get(t_id, {})
        t["upstream_task_ids"] = t_metrics.get("upstream_prereq_ids", [])
        t["downstream_task_ids"] = t_metrics.get("downstream_dependent_ids", [])
        rule_score, rule_reason, _ = calculate_rule_priority(t, metrics_map)
        t["rule_priority_score"] = rule_score
        t["rule_reasoning"] = rule_reason

    meeting["tasks"] = tasks
    meeting["dependencies"] = dependencies
    meeting["task_count"] = len(tasks)
    meeting["dependency_count"] = len(dependencies)
    meeting["cycle_detected"] = has_cycle

    return meeting

@router.get("/health")
def health_check():
    return {"status": "ok", "app": "MeetGraph", "nlp_ready": True, "atml_ready": True}

@router.get("/stats/overview")
def get_overview_stats():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM meetings")
    total_meetings = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM tasks")
    total_tasks = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM tasks WHERE status != 'COMPLETED'")
    open_tasks = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM tasks WHERE status = 'BLOCKED'")
    blocked_tasks = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM tasks WHERE gnn_risk_label = 'AT_RISK' OR risk_label = 'HIGH'")
    at_risk_tasks = cursor.fetchone()[0]

    cursor.execute("SELECT * FROM tasks WHERE deadline IS NOT NULL AND status != 'COMPLETED' ORDER BY deadline ASC LIMIT 5")
    upcoming_deadlines = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT * FROM tasks WHERE status != 'COMPLETED' ORDER BY priority_score DESC, gnn_risk_prob DESC LIMIT 6")
    attention_tasks = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT COUNT(*) FROM dependencies")
    total_dependencies = cursor.fetchone()[0]

    conn.close()

    return {
        "total_meetings": total_meetings,
        "total_tasks": total_tasks,
        "open_tasks": open_tasks,
        "blocked_tasks": blocked_tasks,
        "at_risk_tasks": at_risk_tasks,
        "total_dependencies": total_dependencies,
        "upcoming_deadlines": upcoming_deadlines,
        "attention_tasks": attention_tasks
    }

def _process_and_save_transcript(text_content: str, meet_title: str, m_date: Optional[str] = None):
    if not text_content.strip():
        raise HTTPException(status_code=400, detail="Transcript content cannot be empty.")

    m_date = m_date or datetime.now().strftime("%Y-%m-%d")
    meeting_id = f"meet_{uuid.uuid4().hex[:8]}"

    # Step 1: Run NLP Pipeline
    nlp_result = nlp_pipeline.process_transcript(
        transcript_text=text_content,
        meeting_id=meeting_id
    )

    tasks = nlp_result["tasks"]
    dependencies = nlp_result["dependencies"]

    # Step 2: Build Initial Graph & Run GNN Inference
    G_temp = build_networkx_graph(tasks, dependencies, include_auxiliary_nodes=False)
    tasks = run_gnn_inference_on_tasks(tasks, G_temp)

    # Step 3: Compute Rule Priority Scores
    G_full = build_networkx_graph(tasks, dependencies, include_auxiliary_nodes=True)
    G_tasks = extract_task_subgraph(G_full)
    metrics_map = compute_task_network_metrics(G_tasks)

    for t in tasks:
        rule_score, rule_reason, category = calculate_rule_priority(t, metrics_map)
        t["priority_score"] = rule_score
        t["rule_reasoning"] = rule_reason
        if t.get("gnn_risk_prob", 0.0) >= 0.50:
            t["risk_label"] = "HIGH"
        elif rule_score >= 40.0:
            t["risk_label"] = "MEDIUM"
        else:
            t["risk_label"] = "LOW"

    # Step 4: Persist to SQLite
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO meetings (id, title, transcript, meeting_date) VALUES (?, ?, ?, ?)",
        (meeting_id, meet_title, text_content, m_date)
    )

    for t in tasks:
        cursor.execute("""
            INSERT INTO tasks (
                id, meeting_id, title, description, owner, deadline, deadline_raw,
                status, source_sentence, confidence, risk_label, priority_score,
                gnn_risk_prob, gnn_risk_label
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            t["id"], meeting_id, t["title"], t.get("description"), t.get("owner", "Unknown"),
            t.get("deadline"), t.get("deadline_raw"), t.get("status", "TODO"),
            t.get("source_sentence", ""), t.get("confidence", 0.85), t.get("risk_label", "LOW"),
            t.get("priority_score", 0.0), t.get("gnn_risk_prob"), t.get("gnn_risk_label")
        ))

    for d in dependencies:
        cursor.execute("""
            INSERT INTO dependencies (
                id, meeting_id, source_task_id, target_task_id, relation_type,
                evidence_sentence, confidence
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            d["id"], meeting_id, d["source_task_id"], d["target_task_id"],
            d.get("relation_type", "DEPENDS_ON"), d.get("evidence_sentence", ""),
            d.get("confidence", 0.80)
        ))

    conn.commit()
    conn.close()

    return fetch_meeting_full(meeting_id)

@router.post("/transcripts/process", response_model=MeetingResponse)
def process_transcript_json(payload: MeetingCreate):
    return _process_and_save_transcript(
        text_content=payload.transcript,
        meet_title=payload.title or "Meeting Analysis",
        m_date=payload.meeting_date
    )

@router.post("/transcripts/upload", response_model=MeetingResponse)
def process_transcript_file(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    meeting_date: Optional[str] = Form(None)
):
    try:
        raw_bytes = file.file.read()
        text_content = raw_bytes.decode("utf-8", errors="replace")
        meet_title = title or file.filename or "Uploaded Transcript"
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read uploaded file: {str(e)}")

    return _process_and_save_transcript(
        text_content=text_content,
        meet_title=meet_title,
        m_date=meeting_date
    )

@router.get("/meetings", response_model=List[MeetingResponse])
def get_all_meetings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM meetings ORDER BY created_at DESC")
    meetings = [dict(r) for r in cursor.fetchall()]
    conn.close()

    result = []
    for m in meetings:
        try:
            full = fetch_meeting_full(m["id"])
            result.append(full)
        except Exception:
            pass
    return result

@router.get("/meetings/{meeting_id}", response_model=MeetingResponse)
def get_meeting(meeting_id: str):
    return fetch_meeting_full(meeting_id)

@router.delete("/meetings/{meeting_id}")
def delete_meeting(meeting_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM meetings WHERE id = ?", (meeting_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "meeting_id": meeting_id}

@router.get("/meetings/{meeting_id}/graph", response_model=GraphDataResponse)
def get_meeting_graph(meeting_id: str):
    meeting = fetch_meeting_full(meeting_id)
    tasks = meeting["tasks"]
    dependencies = meeting["dependencies"]

    G = build_networkx_graph(tasks, dependencies, include_auxiliary_nodes=True)
    G_tasks = extract_task_subgraph(G)

    has_cycle, cycles = detect_cycles(G_tasks)
    critical_paths = find_critical_dependency_chains(G_tasks)
    metrics_map = compute_task_network_metrics(G_tasks)

    # Find top blockers
    top_blockers = []
    for t_id, m in metrics_map.items():
        if m.get("downstream_dependents_count", 0) > 0:
            top_blockers.append({
                "task_id": t_id,
                "title": G_tasks.nodes[t_id].get("label", t_id),
                "downstream_count": m["downstream_dependents_count"]
            })
    top_blockers.sort(key=lambda x: x["downstream_count"], reverse=True)

    serialized = serialize_graph_for_ui(G, cycles, critical_paths)

    return {
        "nodes": serialized["nodes"],
        "edges": serialized["edges"],
        "has_cycle": has_cycle,
        "cycles": cycles,
        "critical_paths": critical_paths,
        "top_blockers": top_blockers,
        "total_nodes": serialized["total_nodes"],
        "total_edges": serialized["total_edges"]
    }

@router.get("/meetings/{meeting_id}/recommendations", response_model=PriorityRecommendationResponse)
def get_prioritization_recommendations(meeting_id: str):
    meeting = fetch_meeting_full(meeting_id)
    tasks = meeting["tasks"]
    dependencies = meeting["dependencies"]

    G = build_networkx_graph(tasks, dependencies, include_auxiliary_nodes=True)
    recommendations = generate_recommendations(tasks, G)

    summary = (
        f"Generated {len(recommendations)} actionable recommendations. "
        f"{sum(1 for r in recommendations if r['attention_category'] == 'Critical Upstream Blocker')} tasks are critical upstream blockers. "
        f"{sum(1 for r in recommendations if r.get('gnn_risk_label') == 'AT_RISK')} tasks flagged potentially at risk by GNN neighborhood analysis."
    )

    return {
        "meeting_id": meeting_id,
        "recommendations": recommendations,
        "summary": summary
    }

@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, updates: TaskUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    task_row = cursor.fetchone()
    if not task_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")

    meeting_id = task_row["meeting_id"]

    fields = []
    values = []
    for k, v in updates.dict(exclude_unset=True).items():
        fields.append(f"{k} = ?")
        values.append(v)

    if fields:
        values.append(task_id)
        cursor.execute(f"UPDATE tasks SET {', '.join(fields)} WHERE id = ?", tuple(values))
        conn.commit()

    conn.close()

    # Re-evaluate meeting to refresh priority & network metrics
    meeting = fetch_meeting_full(meeting_id)
    for t in meeting["tasks"]:
        if t["id"] == task_id:
            # Update priority in database
            conn = get_db_connection()
            conn.execute("UPDATE tasks SET priority_score = ? WHERE id = ?", (t.get("rule_priority_score", 0.0), task_id))
            conn.commit()
            conn.close()
            return t

    raise HTTPException(status_code=404, detail="Task update error")

@router.post("/dependencies", response_model=DependencyResponse)
def add_dependency(dep: DependencyCreate):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if tasks exist
    cursor.execute("SELECT meeting_id FROM tasks WHERE id = ?", (dep.source_task_id,))
    s_row = cursor.fetchone()
    cursor.execute("SELECT meeting_id FROM tasks WHERE id = ?", (dep.target_task_id,))
    t_row = cursor.fetchone()

    if not s_row or not t_row:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid source or target task ID")

    meeting_id = dep.meeting_id or s_row["meeting_id"]
    dep_id = f"dep_{uuid.uuid4().hex[:8]}"

    cursor.execute("""
        INSERT INTO dependencies (id, meeting_id, source_task_id, target_task_id, relation_type, evidence_sentence, confidence)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (dep_id, meeting_id, dep.source_task_id, dep.target_task_id, dep.relation_type, dep.evidence_sentence, dep.confidence))

    conn.commit()
    conn.close()

    return {
        "id": dep_id,
        "meeting_id": meeting_id,
        "source_task_id": dep.source_task_id,
        "target_task_id": dep.target_task_id,
        "relation_type": dep.relation_type,
        "evidence_sentence": dep.evidence_sentence,
        "confidence": dep.confidence
    }

@router.delete("/dependencies/{dep_id}")
def delete_dependency(dep_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM dependencies WHERE id = ?", (dep_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "dependency_id": dep_id}

@router.get("/ml/evaluation", response_model=ModelEvaluationComparison)
def get_model_evaluation():
    report = load_evaluation_report()
    return report

@router.post("/ml/train", response_model=ModelEvaluationComparison)
def trigger_training():
    try:
        report = train_and_evaluate(epochs=60)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")
