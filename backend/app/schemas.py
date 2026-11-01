from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    owner: Optional[str] = "Unknown"
    deadline: Optional[str] = None
    deadline_raw: Optional[str] = None
    status: str = "TODO"  # TODO, IN_PROGRESS, BLOCKED, COMPLETED
    source_sentence: str
    confidence: float = 0.85
    risk_label: Optional[str] = "LOW"  # LOW, MEDIUM, HIGH / AT_RISK
    priority_score: Optional[float] = 0.0

class TaskCreate(TaskBase):
    meeting_id: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    owner: Optional[str] = None
    deadline: Optional[str] = None
    deadline_raw: Optional[str] = None
    status: Optional[str] = None
    risk_label: Optional[str] = None
    priority_score: Optional[float] = None

class TaskResponse(TaskBase):
    id: str
    meeting_id: str
    gnn_risk_prob: Optional[float] = None
    gnn_risk_label: Optional[str] = None
    rule_priority_score: Optional[float] = None
    rule_reasoning: Optional[str] = None
    ml_reasoning: Optional[str] = None
    upstream_task_ids: List[str] = []
    downstream_task_ids: List[str] = []

class DependencyBase(BaseModel):
    source_task_id: str  # Task that depends on another task (downstream task)
    target_task_id: str  # Task that must be finished first (upstream prerequisite)
    relation_type: str = "DEPENDS_ON"  # DEPENDS_ON, BLOCKED_BY, CONDITIONAL_ON
    evidence_sentence: str
    confidence: float = 0.80

class DependencyCreate(DependencyBase):
    meeting_id: Optional[str] = None

class DependencyResponse(DependencyBase):
    id: str
    meeting_id: str
    source_title: Optional[str] = None
    target_title: Optional[str] = None

class PersonNode(BaseModel):
    name: str
    assigned_tasks: List[str] = []

class DeadlineNode(BaseModel):
    raw_date: str
    normalized_date: Optional[str] = None
    associated_tasks: List[str] = []

class MeetingCreate(BaseModel):
    title: str = "Meeting Analysis"
    transcript: str
    meeting_date: Optional[str] = None

class MeetingResponse(BaseModel):
    id: str
    title: str
    transcript: str
    meeting_date: Optional[str] = None
    created_at: str
    task_count: int = 0
    dependency_count: int = 0
    cycle_detected: bool = False
    tasks: List[TaskResponse] = []
    dependencies: List[DependencyResponse] = []

class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # 'Task', 'Person', 'Deadline', 'Meeting'
    data: Dict[str, Any]

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str  # 'DEPENDS_ON', 'OWNS', 'DUE_BY', 'MENTIONED_IN'
    data: Dict[str, Any]

class GraphDataResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    has_cycle: bool
    cycles: List[List[str]]
    critical_paths: List[List[str]]
    top_blockers: List[Dict[str, Any]]
    total_nodes: int
    total_edges: int

class RecommendationItem(BaseModel):
    task_id: str
    title: str
    owner: str
    status: str
    deadline: Optional[str]
    rule_priority_score: float
    rule_reason: str
    gnn_risk_prob: Optional[float] = None
    gnn_risk_label: Optional[str] = None
    ml_reason: Optional[str] = None
    downstream_impact_count: int
    downstream_tasks: List[str]
    evidence_sentence: str
    recommendation_source: str  # 'GRAPH_RULE', 'GNN_MODEL', 'HYBRID'
    attention_category: str  # 'Critical Upstream Blocker', 'High Risk Cascade', 'Urgent Deadline', 'Needs Review'

class PriorityRecommendationResponse(BaseModel):
    meeting_id: str
    recommendations: List[RecommendationItem]
    summary: str

class ModelMetrics(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]
    train_loss: Optional[float] = None
    val_loss: Optional[float] = None
    train_accuracy: Optional[float] = None
    val_accuracy: Optional[float] = None
    feature_importance: Optional[Dict[str, float]] = None

class ModelEvaluationComparison(BaseModel):
    dataset_type: str = "Synthetic meeting dependency benchmark (zero-leakage split across disjoint meeting graphs)"
    dataset_stats: Dict[str, Any]
    research_question: str
    gnn_metrics: ModelMetrics
    baseline_metrics: ModelMetrics
    conclusion: str
    limitations: List[str]
    is_trained: bool = True
