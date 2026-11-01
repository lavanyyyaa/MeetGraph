import pytest
import networkx as nx
from app.graph.builder import build_networkx_graph, serialize_graph_for_ui
from app.graph.analysis import (
    extract_task_subgraph, detect_cycles, get_upstream_prerequisites,
    get_downstream_dependents, find_critical_dependency_chains, compute_task_network_metrics
)
from app.graph.priority_engine import calculate_rule_priority, generate_recommendations

def test_graph_builder_and_traversal():
    tasks = [
        {"id": "t1", "title": "Complete UI", "status": "TODO", "owner": "Riya"},
        {"id": "t2", "title": "Complete API", "status": "TODO", "owner": "Arjun"},
        {"id": "t3", "title": "Database Schema", "status": "BLOCKED", "owner": "DB Team"},
        {"id": "t4", "title": "Testing", "status": "TODO", "owner": "QA"}
    ]
    # Edge convention: A -> B means A DEPENDS_ON B (B must finish before A can proceed)
    deps = [
        {"id": "d1", "source_task_id": "t1", "target_task_id": "t2", "relation_type": "DEPENDS_ON"},
        {"id": "d2", "source_task_id": "t2", "target_task_id": "t3", "relation_type": "DEPENDS_ON"},
        {"id": "d3", "source_task_id": "t4", "target_task_id": "t1", "relation_type": "DEPENDS_ON"},
    ]

    G = build_networkx_graph(tasks, deps, include_auxiliary_nodes=False)
    assert len(G.nodes) == 4
    assert len(G.edges) == 3

    # Upstream prerequisites of t4: t1, t2, t3
    prereqs_t4 = get_upstream_prerequisites(G, "t4")
    assert "t1" in prereqs_t4
    assert "t2" in prereqs_t4
    assert "t3" in prereqs_t4

    # Downstream dependents of t3: t2, t1, t4 all depend on t3
    dependents_t3 = get_downstream_dependents(G, "t3")
    assert "t2" in dependents_t3
    assert "t1" in dependents_t3
    assert "t4" in dependents_t3

    # Critical path: longest chain is t4 -> t1 -> t2 -> t3 (length 4)
    crit_paths = find_critical_dependency_chains(G)
    assert len(crit_paths) > 0
    assert len(crit_paths[0]) == 4

def test_cycle_detection():
    # Construct an invalid circular dependency: A -> B -> C -> A
    tasks = [
        {"id": "a", "title": "Task A"},
        {"id": "b", "title": "Task B"},
        {"id": "c", "title": "Task C"}
    ]
    deps = [
        {"id": "d1", "source_task_id": "a", "target_task_id": "b", "relation_type": "DEPENDS_ON"},
        {"id": "d2", "source_task_id": "b", "target_task_id": "c", "relation_type": "DEPENDS_ON"},
        {"id": "d3", "source_task_id": "c", "target_task_id": "a", "relation_type": "DEPENDS_ON"}
    ]
    G = build_networkx_graph(tasks, deps, include_auxiliary_nodes=False)
    has_cycle, cycles = detect_cycles(G)
    assert has_cycle is True
    assert len(cycles) >= 1

def test_priority_engine():
    tasks = [
        {"id": "t_blocker", "title": "Root Prerequisite", "status": "BLOCKED", "deadline": "2026-10-20"},
        {"id": "t_downstream", "title": "Downstream Feature", "status": "TODO"}
    ]
    deps = [{"id": "d1", "source_task_id": "t_downstream", "target_task_id": "t_blocker", "relation_type": "DEPENDS_ON"}]
    G = build_networkx_graph(tasks, deps, include_auxiliary_nodes=True)
    recs = generate_recommendations(tasks, G)

    assert len(recs) == 2
    # The root prerequisite that blocks others and is BLOCKED must have higher priority
    assert recs[0]["task_id"] == "t_blocker"
    assert recs[0]["rule_priority_score"] > recs[1]["rule_priority_score"]
    assert recs[0]["attention_category"] == "Critical Upstream Blocker"
