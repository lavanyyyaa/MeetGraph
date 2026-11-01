import networkx as nx
from typing import Dict, Any, List, Optional
from ..schemas import GraphDataResponse, GraphNode, GraphEdge

def build_networkx_graph(
    tasks: List[Dict[str, Any]],
    dependencies: List[Dict[str, Any]],
    include_auxiliary_nodes: bool = True
) -> nx.DiGraph:
    """
    Constructs a NetworkX DiGraph.
    Edge convention:
      - For Task dependencies:
        If Task A depends on Task B, edge is A -> B with relation_type='DEPENDS_ON'.
        (A cannot proceed until B is complete; B is upstream prerequisite).
      - For Person ownership:
        Person P -> Task T with relation_type='OWNS'.
      - For Deadlines:
        Task T -> Deadline D with relation_type='DUE_BY'.
    """
    G = nx.DiGraph()

    # Add task nodes
    for t in tasks:
        G.add_node(
            t["id"],
            label=t["title"],
            node_type="Task",
            status=t.get("status", "TODO"),
            owner=t.get("owner", "Unknown"),
            deadline=t.get("deadline"),
            deadline_raw=t.get("deadline_raw"),
            source_sentence=t.get("source_sentence", ""),
            confidence=t.get("confidence", 0.85),
            priority_score=t.get("priority_score", 0.0),
            risk_label=t.get("risk_label", "LOW"),
            gnn_risk_prob=t.get("gnn_risk_prob"),
            gnn_risk_label=t.get("gnn_risk_label")
        )

    # Add task dependencies
    for d in dependencies:
        src = d["source_task_id"]
        tgt = d["target_task_id"]
        if src in G and tgt in G:
            G.add_edge(
                src,
                tgt,
                id=d.get("id", f"{src}_{tgt}"),
                relation_type=d.get("relation_type", "DEPENDS_ON"),
                evidence_sentence=d.get("evidence_sentence", ""),
                confidence=d.get("confidence", 0.80)
            )

    if include_auxiliary_nodes:
        # Add Person nodes and OWNS edges
        people_seen = {}
        for t in tasks:
            owner = t.get("owner")
            if owner and owner not in {"Unknown", "QA Team", "database team"}:
                p_id = f"person_{owner.lower().replace(' ', '_')}"
                if p_id not in people_seen:
                    G.add_node(p_id, label=owner, node_type="Person", name=owner)
                    people_seen[p_id] = owner
                G.add_edge(p_id, t["id"], id=f"{p_id}_owns_{t['id']}", relation_type="OWNS")

        # Add Deadline nodes and DUE_BY edges
        deadlines_seen = {}
        for t in tasks:
            d_raw = t.get("deadline_raw")
            d_norm = t.get("deadline")
            if d_raw or d_norm:
                d_id = f"deadline_{(d_norm or d_raw).lower().replace(' ', '_')}"
                if d_id not in deadlines_seen:
                    G.add_node(d_id, label=d_raw or d_norm, node_type="Deadline", raw_date=d_raw, normalized_date=d_norm)
                    deadlines_seen[d_id] = d_raw or d_norm
                G.add_edge(t["id"], d_id, id=f"{t['id']}_due_{d_id}", relation_type="DUE_BY")

    return G

def serialize_graph_for_ui(G: nx.DiGraph, cycles: List[List[str]] = None, critical_paths: List[List[str]] = None) -> Dict[str, Any]:
    """Serializes NetworkX DiGraph into nodes and edges matching frontend React Flow / Cytoscape."""
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

    cycle_nodes = set()
    if cycles:
        for c in cycles:
            cycle_nodes.update(c)

    crit_nodes = set()
    if critical_paths:
        for p in critical_paths:
            crit_nodes.update(p)

    for n_id, attrs in G.nodes(data=True):
        node_type = attrs.get("node_type", "Task")
        nodes.append({
            "id": n_id,
            "label": attrs.get("label", n_id),
            "type": node_type,
            "data": {
                **attrs,
                "is_in_cycle": n_id in cycle_nodes,
                "is_critical": n_id in crit_nodes
            }
        })

    for u, v, attrs in G.edges(data=True):
        rel = attrs.get("relation_type", "DEPENDS_ON")
        edges.append({
            "id": attrs.get("id", f"{u}->{v}"),
            "source": u,
            "target": v,
            "label": rel,
            "data": attrs
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "total_nodes": len(nodes),
        "total_edges": len(edges)
    }
