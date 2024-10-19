import minerl
import gym

def create_environment():
    env = gym.make('MineRLNavigateDense-v0')  # Example environment.
    return env

def run_random_agent():
    env = create_environment()
    obs = env.reset()
    done = False
    while not done:
        action = env.action_space.sample()  # Random action.
        obs, reward, done, _ = env.step(action)
        print(f"Reward: {reward}")
    env.close()

if __name__ == "__main__":
    run_random_agent()
