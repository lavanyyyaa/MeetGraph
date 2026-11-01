import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from typing import Dict, Any, Tuple

class BaselineRiskClassifier:
    """
    Non-graph baseline model using only node-level features without
    graph message passing or dependency neighbor aggregation.
    """
    def __init__(self, model_type: str = "logistic_regression"):
        self.model_type = model_type
        if model_type == "logistic_regression":
            self.model = LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced")
        else:
            self.model = MLPClassifier(hidden_layer_sizes=(32, 16), max_iter=500, random_state=42)

    def fit(self, X: np.ndarray, y: np.ndarray):
        self.model.fit(X, y)
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict(X)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        return self.model.predict_proba(X)
