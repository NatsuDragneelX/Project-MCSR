
# AI-MSR
AI Minecraft Speedruns Project

## Project MCSR: Minecraft Speedrun AI

### Overview

Project MCSR is a collaborative effort by Group 6, consisting of John Slade, Dwight Fowler, Muhanad Yennes, Kolton Truitt, Austin McBurney, Nicole Parra, Gustavo Coloma, Shivam Patel, Gabriel Kleinschmidt, and Josiah Doucet.

The goal of this project is to create an AI agent that can complete the game "Minecraft" as quickly as possible, mimicking and exceeding human speedrunning techniques. By leveraging reinforcement learning and expert human strategies, we aim to set a baseline for the fastest possible completion of the game.

This project uses:
- **Python** and **PyTorch** for building and training the AI models.
- **Minecraft OpenAI Gym** for simulating the game environment.
- Data from **expert speedruns**, **ChunkBase** for world navigation data, and **MinecraftWiki** for item information.

## Project Structure

AI-MSR/
│
├── data/                  # Game data, speedrun logs, and training data.
│   ├── expert_runs/       # Expert speedrun data (e.g., strategies, timings).
│   ├── chunkbase_data/    # Data from ChunkBase.
│   ├── minecraft_wiki/    # Data from MinecraftWiki.
│
├── environment/           # Scripts related to the game environment.
│   ├── minecraft_gym/     # Setup for Minecraft OpenAI Gym environment.
│   ├── environment.py     # Script to initialize and interact with the environment.
│
├── models/                # AI models.
│   ├── agent.py           # Defines the agent's architecture and actions.
│   ├── model_utils.py     # Helper functions for the model.
│   ├── checkpoints/       # Model checkpoints during training.
│
├── training/              # Training scripts and logic.
│   ├── train.py           # Script to train the agent.
│   ├── reward_functions.py # Custom reward functions for different milestones.
│   ├── evaluation.py      # Script to evaluate the agent's performance.
│
├── scripts/               # Utility scripts for various tasks.
│   ├── data_preprocessing.py # Script to process speedrun data.
│   ├── visualization.py   # Visualize training progress, rewards, etc.
│
├── .gitignore             # Files and directories to be ignored by Git.
├── README.md              # Overview of the project and instructions.
├── requirements.txt       # Python dependencies.


## Setup

### Prerequisites

- Python 3.8+
- Virtual environment (recommended)
- Git (for version control)
- Java (required for some Minecraft libraries)

### Installation

1. **Clone the repository**:

   git clone https://github.com/your-username/Project_MCSR.git
   cd AI-MSR

2. **Create a virtual environment and activate it**:

   python3 -m venv env
   source env/bin/activate  # On Windows, use `env\Scripts\activate`

3. **Install the required dependencies**:

   pip install -r requirements.txt

4. **Install the Minecraft Gym environment (using MineRL)**:

   pip install minerl

5. **Set up the Minecraft environment**:

   python environment/environment.py

## Usage

### Running the Environment

To test the environment setup with a random agent, run:

python environment/environment.py

### Training the Agent

To start training the agent, run:

python training/train.py

This will train the agent using reinforcement learning and save model checkpoints in the `models/checkpoints` directory.

### Evaluating the Agent

After training, evaluate the agent's performance using:

python training/evaluation.py

This will provide metrics on how well the agent is performing in the speedrun tasks.

### Visualizing Progress

You can visualize the training progress and rewards using the visualization script:

python scripts/visualization.py

## Contributing

1. Fork the repository.
2. Create your feature branch:

   git checkout -b feature/YourFeature

3. Commit your changes:

   git commit -m 'Add some feature'

4. Push to the branch:

   git push origin feature/YourFeature

5. Open a pull request.

## Resources

- [ChunkBase](https://chunkbase.com)
- [Minecraft Wiki](https://minecraft.wiki)
- [MineRL Documentation](https://minerl.readthedocs.io/en/latest/)

## Acknowledgments

Special thanks to all the contributors of Project MCSR for their dedication and effort in making this project a success.
