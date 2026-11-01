export interface Task {
  id: string;
  meeting_id: string;
  title: string;
  description?: string;
  owner?: string;
  deadline?: string;
  deadline_raw?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
  source_sentence: string;
  confidence: number;
  risk_label: 'LOW' | 'MEDIUM' | 'HIGH';
  priority_score: number;
  gnn_risk_prob?: number;
  gnn_risk_label?: string;
  rule_priority_score?: number;
  rule_reasoning?: string;
  ml_reasoning?: string;
  upstream_task_ids?: string[];
  downstream_task_ids?: string[];
  created_at?: string;
}

export interface Dependency {
  id: string;
  meeting_id: string;
  source_task_id: string; // Downstream task that depends on target
  target_task_id: string; // Upstream prerequisite task
  relation_type: string;
  evidence_sentence: string;
  confidence: number;
  source_title?: string;
  target_title?: string;
}

export interface Meeting {
  id: string;
  title: string;
  transcript: string;
  meeting_date?: string;
  created_at: string;
  task_count: number;
  dependency_count: number;
  cycle_detected: boolean;
  tasks: Task[];
  dependencies: Dependency[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'Task' | 'Person' | 'Deadline' | 'Meeting';
  data: {
    status?: string;
    owner?: string;
    deadline?: string;
    priority_score?: number;
    risk_label?: string;
    gnn_risk_prob?: number;
    gnn_risk_label?: string;
    source_sentence?: string;
    is_in_cycle?: boolean;
    is_critical?: boolean;
    [key: string]: any;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  data: {
    relation_type?: string;
    evidence_sentence?: string;
    confidence?: number;
    [key: string]: any;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  has_cycle: boolean;
  cycles: string[][];
  critical_paths: string[][];
  top_blockers: { task_id: string; title: string; downstream_count: number }[];
  total_nodes: number;
  total_edges: number;
}

export interface Recommendation {
  task_id: string;
  title: string;
  owner: string;
  status: string;
  deadline?: string;
  rule_priority_score: number;
  rule_reason: string;
  gnn_risk_prob?: number;
  gnn_risk_label?: string;
  ml_reason?: string;
  downstream_impact_count: number;
  downstream_tasks: string[];
  evidence_sentence: string;
  recommendation_source: 'GRAPH_RULE' | 'GNN_MODEL' | 'HYBRID';
  attention_category: 'Critical Upstream Blocker' | 'High Risk Cascade' | 'Urgent Deadline' | 'Needs Review';
}

export interface RecommendationResponse {
  meeting_id: string;
  recommendations: Recommendation[];
  summary: string;
}

export interface OverviewStats {
  total_meetings: number;
  total_tasks: number;
  open_tasks: number;
  blocked_tasks: number;
  at_risk_tasks: number;
  total_dependencies: number;
  upcoming_deadlines: Task[];
  attention_tasks: Task[];
}

export interface ModelMetrics {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
}

export interface ModelEvaluationComparison {
  dataset_type: string;
  dataset_stats: {
    num_train_graphs: number;
    num_val_graphs: number;
    num_test_graphs: number;
    num_train_nodes: number;
    num_val_nodes: number;
    num_test_nodes: number;
    feature_dim: number;
    feature_names: string[];
    train_test_split_strategy: string;
  };
  research_question: string;
  gnn_metrics: ModelMetrics;
  baseline_metrics: ModelMetrics;
  conclusion: string;
  limitations: string[];
  is_trained: boolean;
}
