from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
import networkx as nx
from .analysis import compute_task_network_metrics, extract_task_subgraph

def calculate_rule_priority(
    task: Dict[str, Any],
    network_metrics: Dict[str, Any],
    base_date: Optional[datetime] = None
) -> Tuple[float, str, str]:
    """
    Computes rule-based priority score (0-100 scale) and explanation.
    Returns: (score, reason, category)
    """
    status = task.get("status", "TODO").upper()
    if status == "COMPLETED":
        return 0.0, "Task is marked as completed.", "Completed"

    score = 15.0  # Base score for an open task
    reasons = []
    category = "Needs Review"

    t_id = task["id"]
    metrics = network_metrics.get(t_id, {})
    downstream_count = metrics.get("downstream_dependents_count", 0)
    upstream_count = metrics.get("upstream_prereqs_count", 0)

    # 1. Downstream Impact (Cascading blocker)
    if downstream_count > 0:
        impact_bonus = min(downstream_count * 20.0, 45.0)
        score += impact_bonus
        reasons.append(f"Blocks {downstream_count} downstream task(s) in the dependency chain.")
        if downstream_count >= 2:
            category = "Critical Upstream Blocker"

    # 2. Status Blocker
    if status == "BLOCKED":
        score += 25.0
        reasons.append("Task is explicitly flagged as BLOCKED.")
        category = "Critical Upstream Blocker"

    # 3. Deadline Urgency
    deadline_str = task.get("deadline")
    if deadline_str:
        try:
            d_date = datetime.strptime(deadline_str[:10], "%Y-%m-%d")
            ref = base_date or datetime.now()
            diff_days = (d_date.date() - ref.date()).days
            if diff_days <= 1:
                score += 25.0
                reasons.append(f"Urgent deadline approaching in {max(0, diff_days)} day(s).")
                if category != "Critical Upstream Blocker":
                    category = "Urgent Deadline"
            elif diff_days <= 3:
                score += 15.0
                reasons.append(f"Deadline due in {diff_days} days.")
            elif diff_days <= 7:
                score += 5.0
                reasons.append(f"Deadline within a week ({diff_days} days).")
        except Exception:
            pass

    # 4. Upstream Dependency Bottleneck
    if upstream_count > 0 and status != "BLOCKED":
        reasons.append(f"Has {upstream_count} prerequisite task(s) that must finish first.")

    score = min(round(score, 1), 100.0)
    full_reason = " ".join(reasons) if reasons else "Standard active task requiring scheduled execution."
    return score, full_reason, category

def generate_recommendations(
    tasks: List[Dict[str, Any]],
    G_full: nx.DiGraph,
    base_date: Optional[datetime] = None
) -> List[Dict[str, Any]]:
    """
    Generates actionable task prioritization recommendations combining:
    - Rule-based dependency impact & deadlines
    - GNN risk predictions (when available)
    """
    G_tasks = extract_task_subgraph(G_full)
    metrics_map = compute_task_network_metrics(G_tasks)

    recommendations = []

    for t in tasks:
        t_id = t["id"]
        status = t.get("status", "TODO").upper()
        if status == "COMPLETED":
            continue

        rule_score, rule_reason, category = calculate_rule_priority(t, metrics_map, base_date)
        t_metrics = metrics_map.get(t_id, {})
        downstream_ids = t_metrics.get("downstream_dependent_ids", [])

        # Fetch titles of downstream tasks for explainability
        downstream_titles = []
        for d_id in downstream_ids:
            if G_tasks.has_node(d_id):
                downstream_titles.append(G_tasks.nodes[d_id].get("label", d_id))

        gnn_prob = t.get("gnn_risk_prob")
        gnn_label = t.get("gnn_risk_label")

        ml_reason = None
        source = "GRAPH_RULE"

        if gnn_prob is not None:
            if gnn_prob >= 0.5:
                ml_reason = f"GNN predicts high structural delay probability ({round(gnn_prob * 100, 1)}%) based on dependency neighborhood."
                source = "HYBRID" if rule_score >= 50 else "GNN_MODEL"
                if category == "Needs Review":
                    category = "High Risk Cascade"
            else:
                ml_reason = f"GNN predicts low structural risk ({round(gnn_prob * 100, 1)}%)."

        recommendations.append({
            "task_id": t_id,
            "title": t["title"],
            "owner": t.get("owner", "Unknown"),
            "status": status,
            "deadline": t.get("deadline") or t.get("deadline_raw"),
            "rule_priority_score": rule_score,
            "rule_reason": rule_reason,
            "gnn_risk_prob": gnn_prob,
            "gnn_risk_label": gnn_label or ("AT_RISK" if (gnn_prob and gnn_prob >= 0.5) else "LOW"),
            "ml_reason": ml_reason,
            "downstream_impact_count": len(downstream_ids),
            "downstream_tasks": downstream_titles,
            "evidence_sentence": t.get("source_sentence", ""),
            "recommendation_source": source,
            "attention_category": category
        })

    # Sort descending by rule_priority_score and secondarily by gnn_risk_prob
    recommendations.sort(
        key=lambda r: (r["rule_priority_score"], r["gnn_risk_prob"] or 0.0),
        reverse=True
    )
    return recommendations
