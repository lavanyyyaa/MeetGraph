import networkx as nx
from typing import Dict, Any, List, Set, Tuple

def extract_task_subgraph(G: nx.DiGraph) -> nx.DiGraph:
    """Extracts only Task nodes and DEPENDS_ON edges for pure dependency analysis."""
    G_tasks = nx.DiGraph()
    for n, d in G.nodes(data=True):
        if d.get("node_type") == "Task":
            G_tasks.add_node(n, **d)

    for u, v, d in G.edges(data=True):
        if d.get("relation_type") == "DEPENDS_ON" and u in G_tasks and v in G_tasks:
            G_tasks.add_edge(u, v, **d)

    return G_tasks

def detect_cycles(G_tasks: nx.DiGraph) -> Tuple[bool, List[List[str]]]:
    """
    Detects if the dependency graph contains cycles.
    Returns (has_cycle, list_of_cycles).
    """
    try:
        cycles = list(nx.simple_cycles(G_tasks))
        return len(cycles) > 0, cycles
    except Exception:
        return False, []

def get_upstream_prerequisites(G_tasks: nx.DiGraph, task_id: str) -> List[str]:
    """
    Returns all upstream tasks that task_id depends on.
    In our convention: A -> B means A DEPENDS_ON B.
    Therefore, successors/descendants reachable from A along directed edges are its prerequisites!
    """
    if task_id not in G_tasks:
        return []
    try:
        # Successors are direct prerequisites; descendants are all transitive prerequisites
        return list(nx.descendants(G_tasks, task_id))
    except Exception:
        return []

def get_downstream_dependents(G_tasks: nx.DiGraph, task_id: str) -> List[str]:
    """
    Returns all downstream tasks that depend on task_id.
    In our convention: A -> B means A DEPENDS_ON B.
    Therefore, predecessors/ancestors that point towards B are downstream tasks waiting on B!
    """
    if task_id not in G_tasks:
        return []
    try:
        return list(nx.ancestors(G_tasks, task_id))
    except Exception:
        return []

def find_critical_dependency_chains(G_tasks: nx.DiGraph) -> List[List[str]]:
    """
    Identifies the longest path(s) in the DAG.
    If cycles exist, returns paths in condensation or top chains.
    """
    has_cycle, _ = detect_cycles(G_tasks)
    if has_cycle or len(G_tasks.nodes) == 0:
        return []

    try:
        # nx.dag_longest_path returns the single longest chain
        longest = nx.dag_longest_path(G_tasks)
        if len(longest) > 1:
            return [longest]
        return []
    except Exception:
        return []

def compute_task_network_metrics(G_tasks: nx.DiGraph) -> Dict[str, Dict[str, Any]]:
    """
    Computes graph metrics for each task:
      - in_degree: number of downstream dependents pointing to this task (if edge is Downstream -> Upstream)
      - out_degree: number of direct prerequisites this task points to
      - upstream_count: total transitive prerequisites
      - downstream_count: total transitive dependents
      - is_bottleneck: True if downstream_count >= 2
    """
    metrics: Dict[str, Dict[str, Any]] = {}
    has_cycle, _ = detect_cycles(G_tasks)

    for n in G_tasks.nodes:
        # direct prerequisites (out-edges from n)
        direct_prereqs = list(G_tasks.successors(n))
        # direct dependents (in-edges into n)
        direct_dependents = list(G_tasks.predecessors(n))

        transitive_prereqs = get_upstream_prerequisites(G_tasks, n) if not has_cycle else direct_prereqs
        transitive_dependents = get_downstream_dependents(G_tasks, n) if not has_cycle else direct_dependents

        metrics[n] = {
            "task_id": n,
            "direct_prereqs_count": len(direct_prereqs),
            "direct_dependents_count": len(direct_dependents),
            "upstream_prereqs_count": len(transitive_prereqs),
            "downstream_dependents_count": len(transitive_dependents),
            "upstream_prereq_ids": transitive_prereqs,
            "downstream_dependent_ids": transitive_dependents,
            "is_bottleneck": len(transitive_dependents) >= 2
        }

    return metrics
