import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import SAGEConv, GCNConv

class TaskRiskGraphSAGE(nn.Module):
    """
    Graph Neural Network for Task Risk Classification using GraphSAGE convolutions.
    Aggregates features from upstream and downstream neighbors to capture
    cascading blockers, dependency bottlenecks, and deadline squeeze risks.
    """
    def __init__(self, in_channels: int = 10, hidden_channels: int = 32, num_classes: int = 2, dropout: float = 0.2):
        super(TaskRiskGraphSAGE, self).__init__()
        self.conv1 = SAGEConv(in_channels, hidden_channels)
        self.conv2 = SAGEConv(hidden_channels, hidden_channels // 2)
        self.classifier = nn.Linear(hidden_channels // 2, num_classes)
        self.dropout = dropout

    def forward(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        # Layer 1 message passing
        h = self.conv1(x, edge_index)
        h = F.relu(h)
        h = F.dropout(h, p=self.dropout, training=self.training)

        # Layer 2 message passing
        h = self.conv2(h, edge_index)
        h = F.relu(h)
        h = F.dropout(h, p=self.dropout, training=self.training)

        # Task classification head
        logits = self.classifier(h)
        return logits

    def predict_proba(self, x: torch.Tensor, edge_index: torch.Tensor) -> torch.Tensor:
        """Returns softmax probabilities for [Low Risk, At Risk]."""
        self.eval()
        with torch.no_grad():
            logits = self.forward(x, edge_index)
            probs = F.softmax(logits, dim=-1)
        return probs
