from models.agent import SimpleAgent
from environment.environment import create_environment
import torch
import torch.optim as optim

def train_agent():
    env = create_environment()
    agent = SimpleAgent(input_size=env.observation_space.shape[0], action_space=env.action_space.n)
    optimizer = optim.Adam(agent.parameters(), lr=0.001)

    for episode in range(1000):
        obs = env.reset()
        done = False
        total_reward = 0
        while not done:
            action = agent(torch.tensor(obs).float())
            obs, reward, done, _ = env.step(action)
            total_reward += reward
            optimizer.zero_grad()
            loss = -reward  # Example: Negative reward as loss.
            loss.backward()
            optimizer.step()
        print(f"Episode {episode} Total Reward: {total_reward}")

if __name__ == "__main__":
    train_agent()
