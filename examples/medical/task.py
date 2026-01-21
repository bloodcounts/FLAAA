"""Federated learning with Adult Census Income Dataset."""

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
import numpy as np
from sklearn.metrics import auc, balanced_accuracy_score, roc_curve, accuracy_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from datasets import load_dataset
import pandas as pd


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


class AdultDataset(Dataset):
    def __init__(self, features, labels):
        self.features = torch.FloatTensor(features)
        self.labels = torch. LongTensor(labels)

    def __len__(self):
        return len(self.features)

    def __getitem__(self, idx):
        return self.features[idx], self.labels[idx]


def load_adult_data(client_id, batch_size=64):
    """Load preprocessed Adult Census Income dataset from CSV files."""
    import os
    
    data_dir = "/workspace/flwr-abac/flwr_abac/test_data"
    partition_path = os. path.join(data_dir, f"partition_{client_id}.csv")
    
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
def train_model(net, trainloader, valloader, device, local_epochs, learning_rate=0.001, patience=3):
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