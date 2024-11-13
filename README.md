```markdown
# Mineflayer Speedrun Bot

This project creates a Minecraft bot using the [Mineflayer](https://github.com/PrismarineJS/mineflayer) library for Node.js. The bot is programmed to perform tasks that simulate a simplified Minecraft speedrun, such as gathering resources, crafting tools, and mining. This is a starting point for creating a fully automated speedrun bot.

## Features
- **Resource Gathering**: The bot gathers wood, stone, and iron.
- **Basic Crafting**: The bot crafts wooden and stone tools.
- **Exploration**: The bot looks for essential resources and progresses through early game tasks.

## Prerequisites
- **Minecraft Java Edition**: The bot connects to a Minecraft Java Edition server.
- **Node.js**: Node.js must be installed to run the bot.

## Getting Started

### 1. Clone the Repository
Clone the project or download the files to your computer.

### 2. Install Dependencies
Navigate to the project folder in your terminal and run the following command:
```bash
npm install mineflayer
```

```bash
npm install mineflayer mineflayer-pathfinder
```
This installs `mineflayer` and `mineflayer-pathfinder`, which are required to control the bot and enable pathfinding.

### 3. Configure the Bot
Open `bot.js` and configure the bot settings if needed:
- **Username**: The bot’s username (e.g., `"SpeedRunnerBot"`).
- **Host**: Set to `localhost` if running a local server, or the IP address of your server.
- **Port**: The port of your Minecraft server, default is `25565`.

Example configuration in `bot.js`:
```javascript
const bot = mineflayer.createBot({
    username: "SpeedRunnerBot",
    host: "localhost",
    port: 25565,
});
```

### 4. Run the Minecraft Server
Make sure your Minecraft server is running and accessible on the IP and port specified in `bot.js`. The bot will try to connect to this server.

### 5. Run the Bot
In the terminal, navigate to the project folder and start the bot with:
```bash
node bot.js
```

### Commands
The bot responds to certain chat commands in Minecraft:
- **`start`**: Starts the bot’s speedrun tasks, such as gathering wood.
- **`stop`**: Stops the bot.

### Example Workflow
When the bot starts, it will:
1. Gather wood from nearby trees.
2. Craft basic wooden tools.
3. Search for stone and mine it to craft stone tools.
4. Look for iron and start smelting it if a furnace is available.

The bot provides feedback in Minecraft chat as it progresses through each task.

## Notes
- The bot is designed for educational purposes and is a starting template for creating a speedrun bot. Additional features like fighting mobs, locating the End portal, and handling complex situations would require more advanced programming.

## Troubleshooting
- **Connection Refused**: Make sure the Minecraft server IP and port match the `host` and `port` in `bot.js`.
- **Version Mismatch**: The bot may not work with all Minecraft versions. Use a version compatible with `mineflayer`.
- **Dependencies**: Ensure all required dependencies are installed by running `npm install`.