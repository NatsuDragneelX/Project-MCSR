import torch
import torch.nn as nn
import torch.optim as optim

class SimpleAgent(nn.Module):
    def __init__(self, input_size, action_space):
        super(SimpleAgent, self).__init__()
        self.fc1 = nn.Linear(input_size, 128)
        self.fc2 = nn.Linear(128, action_space)
    
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x
