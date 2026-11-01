import random
import numpy as np
import networkx as nx
from typing import List, Dict, Any, Tuple
import torch
from torch_geometric.data import Data

TASK_TEMPLATES = [
    ("Database schema migration", "DB Team", 4),
    ("API gateway route configuration", "Arjun", 3),
    ("User authentication microservice", "Sarah", 5),
    ("Payment webhook handler", "Liam", 4),
    ("Frontend checkout interface", "Riya", 6),
    ("End-to-end integration tests", "QA Team", 3),
    ("Docker container optimization", "DevOps", 2),
    ("Kubernetes deployment manifests", "DevOps", 3),
    ("Load and stress testing", "QA Team", 2),
    ("Security audit vulnerability patch", "Sec Team", 4),
    ("Client SDK generation", "Arjun", 3),
    ("Analytics dashboard charts", "Riya", 5),
    ("Email notification worker", "Liam", 3),
    ("Cache layer invalidation", "Database Team", 2),
    ("Release note documentation", "Product Lead", 2),
    ("Mobile responsive layout fix", "Riya", 3),
    ("Third-party OAuth integration", "Sarah", 4),
    ("Staging environment verification", "QA Team", 2)
]

STATUS_CHOICES = ["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"]

def generate_synthetic_meeting_graph(
    meeting_id: str,
    min_tasks: int = 5,
    max_tasks: int = 10,
    rng: random.Random = None
) -> Tuple[nx.DiGraph, List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Generates a single meeting's dependency graph with realistic topology.
    Convention: edge (u, v) means u DEPENDS_ON v (v must complete before u can start).
    """
    if rng is None:
        rng = random.Random()

    num_tasks = rng.randint(min_tasks, max_tasks)
    selected_templates = rng.sample(TASK_TEMPLATES, num_tasks)

    tasks: List[Dict[str, Any]] = []
    G = nx.DiGraph()

    for idx, (title, owner, base_days) in enumerate(selected_templates):
        task_id = f"{meeting_id}_t{idx+1}"
        status = rng.choices(STATUS_CHOICES, weights=[0.45, 0.30, 0.15, 0.10])[0]
        deadline_days = rng.choice([1, 2, 3, 5, 7, 10, None])
        has_blocker = 1 if status == "BLOCKED" or rng.random() < 0.12 else 0

        task_data = {
            "id": task_id,
            "meeting_id": meeting_id,
            "title": title,
            "owner": owner,
            "status": status,
            "deadline_days": deadline_days if deadline_days is not None else 14,
            "has_deadline": 1.0 if deadline_days is not None else 0.0,
            "has_explicit_blocker": float(has_blocker),
            "source_sentence": f"{owner} will work on {title}.",
            "base_duration": float(base_days)
        }
        tasks.append(task_data)
        G.add_node(task_id, **task_data)

    # Create realistic DAG dependencies (topologically sorted to prevent accidental cycles in baseline ground truth)
    dependencies: List[Dict[str, Any]] = []
    dep_counter = 1
    # Tasks can only depend on earlier tasks (ensures DAG)
    for i in range(1, num_tasks):
        # 60% chance task i depends on 1 or 2 earlier tasks
        if rng.random() < 0.70:
            num_prereqs = rng.choice([1, 2])
            prereq_indices = rng.sample(range(0, i), min(num_prereqs, i))
            for p_idx in prereq_indices:
                u = tasks[i]["id"]     # Downstream task
                v = tasks[p_idx]["id"] # Upstream prerequisite
                G.add_edge(u, v)
                dependencies.append({
                    "id": f"{meeting_id}_dep{dep_counter}",
                    "meeting_id": meeting_id,
                    "source_task_id": u,
                    "target_task_id": v,
                    "relation_type": "DEPENDS_ON",
                    "evidence_sentence": f"{tasks[i]['title']} depends on {tasks[p_idx]['title']}."
                })
                dep_counter += 1

    # Ground truth labeling for Task Risk:
    # A task is AT_RISK (1) if:
    # 1. Any upstream prerequisite is BLOCKED or (TODO with tight deadline).
    # 2. It has an explicit blocker.
    # 3. It has multiple unresolved prerequisites and tight deadline (< 4 days).
    for t in tasks:
        t_id = t["id"]
        prereqs = list(G.successors(t_id))  # Upstream tasks that t depends on
        
        # Check upstream health
        upstream_blocked = any(G.nodes[p].get("status") == "BLOCKED" for p in prereqs)
        upstream_unresolved = sum(1 for p in prereqs if G.nodes[p].get("status") in {"TODO", "BLOCKED"})
        
        is_at_risk = 0
        if t["status"] == "COMPLETED":
            is_at_risk = 0
        elif t["has_explicit_blocker"] == 1.0:
            is_at_risk = 1
        elif upstream_blocked:
            is_at_risk = 1  # Cascading failure risk!
        elif t["has_deadline"] == 1.0 and t["deadline_days"] <= 3 and upstream_unresolved >= 1:
            is_at_risk = 1  # Squeeze risk
        elif upstream_unresolved >= 2 and rng.random() < 0.65:
            is_at_risk = 1
        else:
            is_at_risk = 1 if rng.random() < 0.10 else 0  # Small noise

        t["label_at_risk"] = is_at_risk
        G.nodes[t_id]["label_at_risk"] = is_at_risk

    return G, tasks, dependencies

def extract_node_features(task: Dict[str, Any], G: nx.DiGraph) -> np.ndarray:
    """
    Constructs a 10-dimensional numerical feature vector for each task node:
    0: Status is TODO (0 or 1)
    1: Status is IN_PROGRESS (0 or 1)
    2: Status is BLOCKED (0 or 1)
    3: Status is COMPLETED (0 or 1)
    4: Normalized deadline days [0, 1]
    5: Has deadline flag (0 or 1)
    6: Explicit blocker flag (0 or 1)
    7: Base duration / 10.0
    8: In-degree (downstream dependents waiting on this task)
    9: Out-degree (upstream prerequisites this task is waiting on)
    """
    status = task.get("status", "TODO").upper()
    s_todo = 1.0 if status == "TODO" else 0.0
    s_prog = 1.0 if status == "IN_PROGRESS" else 0.0
    s_block = 1.0 if status == "BLOCKED" else 0.0
    s_comp = 1.0 if status == "COMPLETED" else 0.0

    deadline_val = float(task.get("deadline_days", 14)) / 14.0
    has_dl = float(task.get("has_deadline", 0.0))
    explicit_blocker = float(task.get("has_explicit_blocker", 0.0))
    duration = float(task.get("base_duration", 3.0)) / 10.0

    t_id = task["id"]
    in_deg = float(G.in_degree(t_id)) if G.has_node(t_id) else 0.0
    out_deg = float(G.out_degree(t_id)) if G.has_node(t_id) else 0.0

    return np.array([
        s_todo, s_prog, s_block, s_comp,
        deadline_val, has_dl, explicit_blocker, duration,
        in_deg, out_deg
    ], dtype=np.float32)

def graph_to_pyg_data(G: nx.DiGraph, tasks: List[Dict[str, Any]]) -> Data:
    """Converts a NetworkX meeting graph to a PyTorch Geometric Data object."""
    node_to_idx = {t["id"]: i for i, t in enumerate(tasks)}
    x_list = []
    y_list = []

    for t in tasks:
        feat = extract_node_features(t, G)
        x_list.append(feat)
        y_list.append(t["label_at_risk"])

    x = torch.tensor(np.array(x_list), dtype=torch.float32)
    y = torch.tensor(np.array(y_list), dtype=torch.long)

    # Edge indices: add both directions for undirected message passing across dependencies, or directed
    edge_src = []
    edge_dst = []
    for u, v in G.edges():
        if u in node_to_idx and v in node_to_idx:
            # Directed edge u -> v
            edge_src.append(node_to_idx[u])
            edge_dst.append(node_to_idx[v])
            # Reverse edge v -> u to allow information flow both upstream and downstream
            edge_src.append(node_to_idx[v])
            edge_dst.append(node_to_idx[u])

    if len(edge_src) > 0:
        edge_index = torch.tensor([edge_src, edge_dst], dtype=torch.long)
    else:
        edge_index = torch.empty((2, 0), dtype=torch.long)

    data = Data(x=x, edge_index=edge_index, y=y)
    data.num_nodes = len(tasks)
    return data

def build_benchmark_dataset(
    num_train_meetings: int = 80,
    num_val_meetings: int = 25,
    num_test_meetings: int = 25,
    seed: int = 42
) -> Dict[str, Any]:
    """
    Builds synthetic meeting dependency benchmark with zero graph-level leakage.
    Train, Val, and Test contain completely separate meeting graphs!
    """
    rng = random.Random(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)

    def generate_split(count: int, prefix: str):
        graphs = []
        pyg_list = []
        all_tasks = []
        for i in range(count):
            m_id = f"{prefix}_m{i+1}"
            G, tasks, deps = generate_synthetic_meeting_graph(m_id, min_tasks=5, max_tasks=10, rng=rng)
            pyg_data = graph_to_pyg_data(G, tasks)
            graphs.append(G)
            pyg_list.append(pyg_data)
            all_tasks.extend(tasks)
        return graphs, pyg_list, all_tasks

    train_graphs, train_pyg, train_tasks = generate_split(num_train_meetings, "train")
    val_graphs, val_pyg, val_tasks = generate_split(num_val_meetings, "val")
    test_graphs, test_pyg, test_tasks = generate_split(num_test_meetings, "test")

    return {
        "train": {"graphs": train_graphs, "pyg": train_pyg, "tasks": train_tasks},
        "val": {"graphs": val_graphs, "pyg": val_pyg, "tasks": val_tasks},
        "test": {"graphs": test_graphs, "pyg": test_pyg, "tasks": test_tasks},
        "stats": {
            "num_train_graphs": num_train_meetings,
            "num_val_graphs": num_val_meetings,
            "num_test_graphs": num_test_meetings,
            "num_train_nodes": len(train_tasks),
            "num_val_nodes": len(val_tasks),
            "num_test_nodes": len(test_tasks),
            "feature_dim": 10,
            "feature_names": [
                "Status: TODO", "Status: IN_PROGRESS", "Status: BLOCKED", "Status: COMPLETED",
                "Deadline Proximity", "Has Deadline Flag", "Explicit Blocker Flag", "Base Duration",
                "Downstream Dependents (In-Degree)", "Upstream Prerequisites (Out-Degree)"
            ]
        }
    }
