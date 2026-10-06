"""Models and training utilities for federated binary classification."""

import math
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
import numpy as np
from sklearn.metrics import auc, balanced_accuracy_score, roc_curve, accuracy_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from datasets import load_dataset
import pandas as pd


def parse_hidden_dims(value, default=(64, 64)):
    """Accept either a list of ints (legacy default) or the comma-separated
    string form required by Flower's run-config value types (e.g. "64,32")."""
    if isinstance(value, str):
        return [int(v) for v in value.split(",") if v.strip()]
    if isinstance(value, (list, tuple)):
        return list(value)
    return list(default)


class DenseClassifier(nn.Module):
    def __init__(self, input_dim, output_dim, hidden_dims=[64, 64], dropout=0.3):
        super(DenseClassifier, self).__init__()
        layers = []
        prev_dim = input_dim
        
        for h_dim in hidden_dims:  
            layers.append(nn.Linear(prev_dim, h_dim))
            layers.append(nn.ReLU())
            layers.append(nn. Dropout(dropout))
            prev_dim = h_dim
        
        layers.append(nn.Linear(prev_dim, output_dim))
        self.net = nn.Sequential(*layers)
    
    def forward(self, x):
        return self.net(x)


def last_linear_parameter_names(net):
    """Return the state-dict keys of the last linear layer for FedPer."""
    linear_modules = [name for name, module in net.named_modules() if isinstance(module, nn.Linear)]
    if not linear_modules:
        raise ValueError("FedPer requires at least one linear layer")
    prefix = linear_modules[-1]
    return [f"{prefix}.weight", f"{prefix}.bias"]


class AdultDataset(Dataset):
    def __init__(self, features, labels):
        self.features = torch.FloatTensor(features)
        self.labels = torch. LongTensor(labels)

    def __len__(self):
        return len(self.features)

    def __getitem__(self, idx):
        return self.features[idx], self.labels[idx]


_INTERVAL_METADATA_CACHE = None


def get_interval_metadata():
    """Read the metadata.json produced by prepare_interval_data.py (cached)."""
    import json
    import os

    global _INTERVAL_METADATA_CACHE
    if _INTERVAL_METADATA_CACHE is None:
        meta_path = os.path.join(os.getenv("INTERVAL_DATA_DIR", os.path.join(os.path.dirname(__file__), "interval_data")), "metadata.json")
        with open(meta_path) as fh:
            _INTERVAL_METADATA_CACHE = json.load(fh)
    return _INTERVAL_METADATA_CACHE


def load_interval_centre(centre_id, batch_size=64, val_fraction=0.15, seed=42):
    """Load a single INTERVAL donation-centre partition prepared by
    prepare_interval_data.py.

    The centre's own train split is further divided into an internal
    train/validation split (for early stopping); the centre's own val split
    (never used for training or early stopping) is returned as the held-out
    test loader used for the reported per-centre ROC-AUC.
    """
    import os

    data_dir = os.getenv("INTERVAL_DATA_DIR", os.path.join(os.path.dirname(__file__), "interval_data"))
    npz_path = os.path.join(data_dir, f"centre_{centre_id}.npz")
    if not os.path.exists(npz_path):
        raise FileNotFoundError(
            f"INTERVAL centre file not found: {npz_path}. Run prepare_interval_data.py first."
        )

    data = np.load(npz_path)
    x_train_full, y_train_full = data["x_train"], data["y_train"]
    x_test, y_test = data["x_val"], data["y_val"]

    rng = np.random.default_rng(seed + int(centre_id))
    n = len(y_train_full)
    idx = rng.permutation(n)
    n_val = max(1, int(n * val_fraction))
    val_idx, train_idx = idx[:n_val], idx[n_val:]

    x_train, y_train = x_train_full[train_idx], y_train_full[train_idx]
    x_val, y_val = x_train_full[val_idx], y_train_full[val_idx]

    train_dataset = AdultDataset(x_train, y_train)
    val_dataset = AdultDataset(x_val, y_val)
    test_dataset = AdultDataset(x_test, y_test)

    class_counts = np.bincount(y_train, minlength=2)
    class_weights = 1 / (class_counts + 1e-8)
    sample_weights = class_weights[y_train]
    train_sampler = WeightedRandomSampler(sample_weights, len(sample_weights))

    train_loader = DataLoader(train_dataset, batch_size=batch_size, sampler=train_sampler)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    return train_loader, val_loader, test_loader, len(train_dataset)


def load_adult_data(client_id, batch_size=64):
    """Load preprocessed Adult Census Income dataset from CSV files."""
    import os
    
    data_dir = os.path.join(os.path.dirname(__file__), "test_data")
    partition_path = os.path.join(data_dir, f"partition_{client_id}.csv")
    
    if not os.path.exists(partition_path):
        raise FileNotFoundError(f"Partition file not found: {partition_path}")
    
    df = pd.read_csv(partition_path)
    
    label_column = 'income'
    feature_columns = [col for col in df.columns if col != label_column]
    
    print(f"Using {len(feature_columns)} features: {feature_columns}")
    
    if label_column not in df.columns:
        raise ValueError(f"Label column '{label_column}' not found in CSV")
    
    train_df, test_df = train_test_split(
        df, test_size=0.2, stratify=df[label_column], random_state=42
    )
    
    val_df, test_df = train_test_split(
        test_df, test_size=0.5, stratify=test_df[label_column], random_state=42
    )
    
    # Extract features and labels
    features = train_df[feature_columns].values
    labels = train_df[label_column].values
    val_features = val_df[feature_columns].values
    val_labels = val_df[label_column].values
    test_features = test_df[feature_columns].values
    test_labels = test_df[label_column].values
    
    # Create datasets
    train_dataset = AdultDataset(features, labels)
    val_dataset = AdultDataset(val_features, val_labels)
    test_dataset = AdultDataset(test_features, test_labels)
    
    # Create balanced sampling weights
    class_counts = np.bincount(labels)
    class_weights = 1 / (class_counts + 1e-8)
    sample_weights = class_weights[labels]
    
    # Create data loaders
    train_sampler = WeightedRandomSampler(sample_weights, len(sample_weights))
    train_loader = DataLoader(train_dataset, batch_size=batch_size, sampler=train_sampler)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
    
    return train_loader, val_loader, test_loader, len(train_dataset)
# --------------------------------------------------------------------------- #
# Training Function
# --------------------------------------------------------------------------- #
def train_model(net, trainloader, valloader, device, local_epochs, learning_rate=0.001, patience=3,
                proximal_reference=None, proximal_mu=0.0):
    """Train the model with early stopping."""
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(net.parameters(), lr=learning_rate, weight_decay=1e-5)
    
    best_val_loss = float('inf')
    best_state_dict = None
    epochs_without_improvement = 0
    
    for epoch in range(local_epochs):
        # Training
        net.train()
        train_loss = 0.0
        
        for batch_data, batch_label in trainloader:
            batch_data, batch_label = batch_data.to(device), batch_label.to(device)
            
            optimizer.zero_grad()
            outputs = net(batch_data)
            loss = criterion(outputs, batch_label)
            if proximal_mu:
                if proximal_reference is None:
                    raise ValueError("FedProx requires a global-parameter reference")
                proximal_penalty = sum(
                    torch.sum((parameter - proximal_reference[name]) ** 2)
                    for name, parameter in net.named_parameters()
                )
                loss = loss + 0.5 * proximal_mu * proximal_penalty
            loss.backward()
            torch.nn.utils.clip_grad_norm_(net.parameters(), max_norm=1.0)
            optimizer.step()
            
            train_loss += loss.item() * batch_data.size(0)
        
        train_loss /= len(trainloader.dataset)
        
        # Validation
        net.eval()
        val_loss = 0.0
        
        with torch.no_grad():
            for batch_data, batch_label in valloader:
                batch_data, batch_label = batch_data.to(device), batch_label.to(device)
                outputs = net(batch_data)
                loss = criterion(outputs, batch_label)
                val_loss += loss.item() * batch_data.size(0)
        
        val_loss /= len(valloader.dataset)
        
        print(f"  Epoch {epoch+1}/{local_epochs}:  train_loss={train_loss:.4f}, val_loss={val_loss:.4f}")
        
        # Early stopping
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_state_dict = net.state_dict().copy()
            epochs_without_improvement = 0
        else: 
            epochs_without_improvement += 1
        
        if epochs_without_improvement >= patience: 
            print(f"  Early stopping at epoch {epoch+1}")
            break
    
    if best_state_dict is not None:
        net.load_state_dict(best_state_dict)
    

    return best_state_dict, train_loss, val_loss


def evaluate_model(net, testloader, device):
    """Evaluate the model on test data."""
    net.eval()
    all_preds, all_labels, all_probs = [], [], []
    
    with torch.no_grad():
        for batch_data, batch_label in testloader:
            batch_data, batch_label = batch_data.to(device), batch_label.to(device)
            outputs = net(batch_data)
            probs = torch.softmax(outputs, dim=1)
            _, predicted = torch.max(outputs, 1)
            
            all_preds.extend(predicted. cpu().numpy())
            all_labels.extend(batch_label. cpu().numpy())
            all_probs.extend(probs[: , 1].cpu().numpy())
    
    # Calculate metrics
    accuracy = accuracy_score(all_labels, all_preds)
    balanced_acc = balanced_accuracy_score(all_labels, all_preds)
    fpr, tpr, _ = roc_curve(all_labels, all_probs)
    roc_auc = auc(fpr, tpr)
    
    # Calculate loss
    criterion = nn.CrossEntropyLoss()
    test_loss = 0.0
    
    with torch.no_grad():
        for batch_data, batch_label in testloader:
            batch_data, batch_label = batch_data.to(device), batch_label.to(device)
            outputs = net(batch_data)
            loss = criterion(outputs, batch_label)
            test_loss += loss.item() * batch_data.size(0)
    
    test_loss /= len(testloader.dataset)
    
    return test_loss, len(testloader.dataset), {
        "accuracy": accuracy,
        "balanced_accuracy": balanced_acc,
        "roc_auc": roc_auc
    }


# --------------------------------------------------------------------------- #
# FedMAP: ICNN prior, client-side loss, and contribution weighting.
#
# ICNN-based priors for local maximum-a-posteriori estimation.

class InputConvexNN(nn.Module):
    """Input Convex Neural Network for learning adaptive priors.

    Uses non-negative hidden-layer weights to preserve input convexity.
    """

    def __init__(self, param_size, hidden_dims=(64, 32), alpha=0.1, epsilon=1e-4):
        super().__init__()
        self.alpha = alpha
        self.epsilon = epsilon
        input_dim = param_size * 2

        layers = [nn.Linear(input_dim, hidden_dims[0], bias=True), nn.Softplus()]
        for i in range(len(hidden_dims) - 1):
            layers.append(nn.Linear(hidden_dims[i], hidden_dims[i + 1], bias=True))
            layers.append(nn.Softplus())
        layers.append(nn.Linear(hidden_dims[-1], 1, bias=True))
        self.net = nn.Sequential(*layers)

        for layer in self.net:
            if isinstance(layer, nn.Linear) and layer is not self.net[0]:
                layer.weight.data.clamp_(min=0)

    def forward(self, theta, gamma):
        x = torch.cat((theta, gamma), dim=-1)
        base_term = self.net(x)
        quad_term = self.alpha / 2 * (theta - gamma).pow(2).sum(dim=-1, keepdim=True)
        perturbation = self.epsilon * (
            theta.pow(2).sum(dim=-1, keepdim=True) + gamma.pow(2).sum(dim=-1, keepdim=True)
        )
        return base_term + quad_term + perturbation

    def enforce_convexity(self):
        for layer in self.net:
            if isinstance(layer, nn.Linear) and layer is not self.net[0]:
                layer.weight.data.clamp_(min=0)


def sanitize_param_name(name):
    """ArrayRecord/ModuleDict keys cannot contain '.'; mirrors the convention
    already used in fedmap_grid_with_filter.py's _train_icnn."""
    return name.replace(".", "__")


def build_icnn_modules(model, hidden_dims=(64, 32), alpha=0.1):
    """Build one InputConvexNN per named parameter tensor of `model`, keyed
    by its sanitised name — the same ModuleDict convention the server-side
    FedMAPWithFilter._train_icnn expects."""
    modules = {}
    for name, param in model.named_parameters():
        modules[sanitize_param_name(name)] = InputConvexNN(
            param_size=param.numel(), hidden_dims=hidden_dims, alpha=alpha
        )
    return nn.ModuleDict(modules)


class ICNNPriorDict(nn.Module):
    """Prior term sum_i ICNN_i(theta_i, gamma_i) using ModuleDict/sanitised
    parameter names (client-side counterpart of the server's _train_icnn)."""

    def __init__(self, cnnet_modules):
        super().__init__()
        self.cnnet_modules = cnnet_modules

    def forward(self, model, gamma):
        device = next(model.parameters()).device
        total = torch.zeros((), device=device)
        model_params = {sanitize_param_name(n): p for n, p in model.named_parameters()}
        gamma_params = {sanitize_param_name(n): p for n, p in gamma.named_parameters()}
        for sanitized_name, cnnet in self.cnnet_modules.items():
            if sanitized_name not in model_params or sanitized_name not in gamma_params:
                continue
            cnnet = cnnet.to(device)
            theta_flat = model_params[sanitized_name].view(-1).unsqueeze(0).to(device)
            gamma_flat = gamma_params[sanitized_name].view(-1).unsqueeze(0).to(device)
            total = total + cnnet(theta_flat, gamma_flat).sum()
        return total


class FedMAPLoss(nn.Module):
    """Loss = CrossEntropy(outputs, targets) + ICNN prior(model, gamma)."""

    def __init__(self, pred_loss, prior, gamma):
        super().__init__()
        self.pred_loss = pred_loss
        self.prior = prior
        self.gamma = gamma

    def forward(self, outputs, targets, model):
        return self.pred_loss(outputs, targets) + self.prior(model, self.gamma)


def train_model_fedmap(net, gamma_net, cnnet_modules, trainloader, valloader, device,
                        local_epochs, learning_rate=0.001, patience=3):
    """Client-side FedMAP local training: same structure as train_model, but
    with the ICNN-prior-augmented loss instead of plain cross-entropy."""
    prior = ICNNPriorDict(cnnet_modules)
    criterion = FedMAPLoss(nn.CrossEntropyLoss(), prior, gamma_net)
    optimizer = torch.optim.Adam(net.parameters(), lr=learning_rate, weight_decay=1e-5)

    best_val_loss = float("inf")
    best_state_dict = None
    epochs_without_improvement = 0
    train_loss, val_loss = 0.0, 0.0

    for epoch in range(local_epochs):
        net.train()
        train_loss = 0.0
        for batch_data, batch_label in trainloader:
            batch_data, batch_label = batch_data.to(device), batch_label.to(device)
            optimizer.zero_grad()
            outputs = net(batch_data)
            loss = criterion(outputs, batch_label, net)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(net.parameters(), max_norm=1.0)
            optimizer.step()
            train_loss += loss.item() * batch_data.size(0)
        train_loss /= len(trainloader.dataset)

        net.eval()
        val_loss = 0.0
        with torch.no_grad():
            for batch_data, batch_label in valloader:
                batch_data, batch_label = batch_data.to(device), batch_label.to(device)
                outputs = net(batch_data)
                loss = criterion(outputs, batch_label, net)
                val_loss += loss.item() * batch_data.size(0)
        val_loss /= len(valloader.dataset)

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_state_dict = net.state_dict().copy()
            epochs_without_improvement = 0
        else:
            epochs_without_improvement += 1
        if epochs_without_improvement >= patience:
            break

    if best_state_dict is not None:
        net.load_state_dict(best_state_dict)

    contribution = calculate_fedmap_contribution(net, trainloader, gamma_net, cnnet_modules, device)
    return best_state_dict, contribution, train_loss, val_loss


@torch.no_grad()
def calculate_fedmap_contribution(net, trainloader, gamma_net, cnnet_modules, device):
    """Per-sample-normalised contribution weight, identical formula to
    The contribution is exp(mean_loglik - prior_term/N)."""
    net.eval()
    gamma_net.eval()
    for cnnet in cnnet_modules.values():
        cnnet.eval()

    dataset = trainloader.dataset
    likelihood_loader = DataLoader(dataset, batch_size=128, shuffle=False)

    total_neg_loglik = 0.0
    n = 0
    for batch_data, batch_label in likelihood_loader:
        batch_data, batch_label = batch_data.to(device), batch_label.to(device)
        logits = net(batch_data)
        total_neg_loglik += torch.nn.functional.cross_entropy(
            logits, batch_label, reduction="sum"
        ).item()
        n += batch_data.size(0)

    if n == 0:
        return 0.1

    mean_loglik = -total_neg_loglik / n

    net_params = {sanitize_param_name(name): p for name, p in net.named_parameters()}
    gamma_params = {sanitize_param_name(name): p for name, p in gamma_net.named_parameters()}
    prior_term = 0.0
    for sanitized_name, cnnet in cnnet_modules.items():
        if sanitized_name not in net_params or sanitized_name not in gamma_params:
            continue
        theta_flat = net_params[sanitized_name].detach().view(1, -1).to(device)
        gamma_flat = gamma_params[sanitized_name].detach().view(1, -1).to(device)
        prior_term += cnnet(theta_flat, gamma_flat).sum().item()

    log_contribution = mean_loglik - (prior_term / n)
    contribution = float(math.exp(log_contribution))
    return max(contribution, 0.1)


# --------------------------------------------------------------------------- #
# Model Parameter Utilities
# --------------------------------------------------------------------------- #
def get_model_params(model):
    """Return model parameters as a list of NumPy arrays."""
    return [val.cpu().numpy() for _, val in model.state_dict().items()]


def set_model_params(model, params):
    """Set model parameters from a list of NumPy arrays."""
    params_dict = zip(model.state_dict().keys(), params)
    state_dict = {k: torch.from_numpy(v) for k, v in params_dict}
    model.load_state_dict(state_dict, strict=True)
