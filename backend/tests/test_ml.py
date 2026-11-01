import pytest
import torch
from app.ml.dataset_generator import build_benchmark_dataset, extract_node_features
from app.ml.gnn_model import TaskRiskGraphSAGE
from app.ml.evaluator import load_evaluation_report, get_trained_gnn_model

def test_benchmark_dataset_generation():
    dataset = build_benchmark_dataset(num_train_meetings=5, num_val_meetings=2, num_test_meetings=2, seed=123)
    assert len(dataset["train"]["graphs"]) == 5
    assert len(dataset["val"]["graphs"]) == 2
    assert len(dataset["test"]["graphs"]) == 2

    # Verify zero leakage across splits
    train_ids = {t["id"] for t in dataset["train"]["tasks"]}
    test_ids = {t["id"] for t in dataset["test"]["tasks"]}
    assert len(train_ids.intersection(test_ids)) == 0

def test_gnn_forward_pass():
    model = TaskRiskGraphSAGE(in_channels=10, hidden_channels=16, num_classes=2)
    x = torch.randn((4, 10))
    edge_index = torch.tensor([[0, 1, 2, 3], [1, 2, 3, 0]], dtype=torch.long)
    out = model(x, edge_index)
    assert out.shape == (4, 2)

    probs = model.predict_proba(x, edge_index)
    assert probs.shape == (4, 2)
    assert torch.allclose(probs.sum(dim=-1), torch.ones(4), atol=1e-4)

def test_saved_evaluation_metrics():
    report = load_evaluation_report()
    assert report["is_trained"] is True
    assert "gnn_metrics" in report
    assert "baseline_metrics" in report
    assert report["gnn_metrics"]["f1_score"] > 0.0
    assert report["baseline_metrics"]["f1_score"] > 0.0
    assert len(report["gnn_metrics"]["confusion_matrix"]) == 2
