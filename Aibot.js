const mineflayer = require("mineflayer");
const { goals } = require("mineflayer-pathfinder");
const { pathfinder, Movements } = require("mineflayer-pathfinder");
const { Vec3 } = require("vec3");

// Configuration
const playerUsername = "YourMinecraftUsername"; // Replace with your Minecraft username
const maxGatherAttempts = 5; // Max attempts to gather resources
const gatherCooldown = 5000; // Cooldown between gathering attempts in ms
let gatherAttempts = 0;
let woodCollected = 0;
let bot = createBotInstance();

// Function to create and configure the bot instance
function createBotInstance() {
    const botInstance = mineflayer.createBot({
        username: "SpeedRunnerBot",
        host: "localhost",
        port: 25565, // Replace with your server's port if different
    });

    botInstance.loadPlugin(pathfinder);
    botInstance.once("spawn", onBotSpawn);
    botInstance.on("end", onBotEnd);
    botInstance.on("kicked", (reason) => console.log("Bot was kicked:", reason));
    botInstance.on("error", (err) => console.log("Bot encountered an error:", err));
    botInstance.on("chat", onChatCommand);

    return botInstance;
}

// Handle bot spawn: Start gathering resources and set keep-alive
function onBotSpawn() {
    console.log("Bot has spawned and is starting the search-and-gather process.");
    bot.chat("Speedrun initiated! Searching for wood...");
    searchAndGather();
    keepAlive();
}

// Handle bot disconnection: Reconnect after 5 seconds
function onBotEnd() {
    console.log("Bot disconnected. Attempting to reconnect...");
    setTimeout(() => {
        bot = createBotInstance();
    }, 5000);
}

// Handle chat commands
function onChatCommand(username, message) {
    if (username === bot.username) return; // Ignore bot's own messages

    if (message === "come" && username === playerUsername) {
        teleportToPlayer();
    } else if (message === "start") {
        woodCollected = 0; // Reset wood collection
        searchAndGather();
        bot.chat("Starting resource collection...");
    } else if (message === "stop") {
        bot.chat("Stopping and disconnecting.");
        bot.quit();
    } else {
        bot.chat("Command not recognized. Available commands: 'come', 'start', 'stop'.");
    }
}

// Teleport bot to the player's location on request
function teleportToPlayer() {
    const player = bot.players[playerUsername];
    if (player && player.entity) {
        const playerPosition = player.entity.position;
        bot.chat(`Teleporting to ${playerUsername}...`);
        bot.pathfinder.setGoal(new goals.GoalNear(playerPosition.x, playerPosition.y, playerPosition.z, 1));
    } else {
        bot.chat("Player not found or not visible.");
    }
}

// Keep-alive function to prevent idle disconnection
function keepAlive() {
    setInterval(() => {
        if (bot.entity && bot.entity.isValid) {
            bot.setControlState("jump", true);
            setTimeout(() => bot.setControlState("jump", false), 500); // Jump for 0.5 seconds
            console.log("Keep-alive jump to prevent idle timeout.");
        }
    }, 60000); // Jump every 60 seconds
}

// Search and gather wood for crafting
async function searchAndGather() {
    if (gatherAttempts >= maxGatherAttempts) {
        console.log("Reached maximum gather attempts. Stopping gathering process.");
        bot.chat("Unable to gather enough wood. Stopping.");
        return;
    }

    gatherAttempts++;
    const woodTypes = [
        "oak_log", "spruce_log", "birch_log", "jungle_log",
        "acacia_log", "dark_oak_log", "mangrove_log",
        "crimson_stem", "warped_stem"
    ];

    const tree = bot.findBlock({
        matching: block => woodTypes.includes(block.name),
        maxDistance: 32,
    });

    if (tree) {
        console.log("Tree found at:", tree.position);
        await moveTo(tree.position);
        await bot.dig(tree);
        woodCollected++;
        bot.chat("Wood collected: " + woodCollected);
    } else {
        console.log("No trees nearby. Moving to a new location...");
        const randomX = bot.entity.position.x + Math.floor(Math.random() * 20 - 10);
        const randomZ = bot.entity.position.z + Math.floor(Math.random() * 20 - 10);
        await moveTo(new Vec3(randomX, bot.entity.position.y, randomZ));
    }

    // Retry gathering after cooldown if wood not collected
    setTimeout(() => {
        if (woodCollected < 5) {
            searchAndGather();
        } else {
            bot.chat("Sufficient wood collected. Moving to crafting stage...");
            craftWoodenTools();
        }
    }, gatherCooldown);
}

// Move to a target position with hole detection and avoidance
async function moveTo(position) {
    const movements = new Movements(bot, bot.pathfinder);
    movements.allowSprinting = true;
    bot.pathfinder.setMovements(movements);

    const isSafe = (pos) => {
        const below = bot.blockAt(pos.offset(0, -1, 0));
        const twoBlocksBelow = bot.blockAt(pos.offset(0, -2, 0));
        return (below && below.boundingBox === "block") || (twoBlocksBelow && twoBlocksBelow.boundingBox === "block");
    };

    let attempts = 0;
    while (attempts < 3) {
        if (isSafe(position)) {
            await bot.pathfinder.goto(new goals.GoalBlock(position.x, position.y, position.z));
            return;
        } else {
            console.log("Detected a hole or unsafe area. Trying to find an alternative path...");
            bot.chat("Hole detected! Avoiding...");
            const alternativePosition = position.offset(1, 0, 1);
            if (isSafe(alternativePosition)) {
                await bot.pathfinder.goto(new goals.GoalBlock(alternativePosition.x, alternativePosition.y, alternativePosition.z));
                return;
            }
        }
        attempts++;
        await bot.waitForTicks(10);
    }

    console.log("Unable to find a safe path. Moving in a new direction.");
    bot.chat("No safe path found, changing direction.");
    const randomX = bot.entity.position.x + Math.floor(Math.random() * 6 - 3);
    const randomZ = bot.entity.position.z + Math.floor(Math.random() * 6 - 3);
    await bot.pathfinder.goto(new goals.GoalBlock(randomX, bot.entity.position.y, randomZ));
}

// Craft wooden tools after gathering wood
async function craftWoodenTools() {
    console.log("Crafting wooden tools...");

    const logs = bot.inventory.items().find(item => item.name.includes("log"));
    if (!logs) {
        console.log("No logs available for crafting planks. Aborting crafting.");
        return;
    }

    const plankRecipe = bot.recipesFor("planks")[0];
    if (plankRecipe) {
        await bot.craft(plankRecipe, 4, null);
        console.log("Crafted planks.");
    } else {
        console.log("No recipe found for planks.");
        return;
    }

    const planks = bot.inventory.items().find(item => item.name.includes("planks"));
    if (!planks) {
        console.log("No planks available for crafting sticks.");
        return;
    }

    const stickRecipe = bot.recipesFor("stick")[0];
    if (stickRecipe) {
        await bot.craft(stickRecipe, 4, null);
        console.log("Crafted sticks.");
    } else {
        console.log("No recipe found for sticks.");
        return;
    }

    const pickaxeRecipe = bot.recipesFor("wooden_pickaxe")[0];
    if (pickaxeRecipe) {
        await bot.craft(pickaxeRecipe, 1, null);
        bot.chat("Wooden pickaxe crafted!");
    } else {
        console.log("No recipe found for wooden pickaxe.");
    }
}

// Gather stone for crafting stone tools
async function gatherStone() {
    console.log("Gathering stone...");
    const stone = bot.findBlock({
        matching: block => block.name === "stone",
        maxDistance: 16,
    });

    if (stone) {
        await moveTo(stone.position);
        await bot.dig(stone);
        bot.chat("Stone gathered!");
        craftStoneTools();
    } else {
        console.log("No stone nearby. Moving to a new location...");
        bot.chat("No stone nearby to gather.");
    }
}

// Craft stone tools after gathering stone
async function craftStoneTools() {
    console.log("Crafting stone tools...");
    const pickaxeRecipe = bot.recipesFor("stone_pickaxe")[0];

    if (pickaxeRecipe) {
        await bot.craft(pickaxeRecipe, 1, null);
        bot.chat("Stone pickaxe crafted!");
    } else {
        bot.chat("Unable to craft stone pickaxe.");
        console.log("Stone pickaxe recipe not found or insufficient resources.");
    }
}
