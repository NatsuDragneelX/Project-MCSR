const mineflayer = require("mineflayer");
const { goals } = require("mineflayer-pathfinder");
const { pathfinder, Movements } = require("mineflayer-pathfinder");
const { Vec3 } = require("vec3");

const playerUsername = "NatsuDragonX"; // Replace with your Minecraft username
let bot = createBotInstance();
let gatherAttempts = 0;
const maxGatherAttempts = 5;
const gatherCooldown = 5000;
let woodCollected = 0;
let ironCollected = 0;

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

function onBotSpawn() {
    console.log("Bot has spawned and is starting the speedrun process.");
    bot.chat("Starting resource gathering for speedrun...");
    searchAndGather();
    keepAlive();
}

function onBotEnd() {
    console.log("Bot disconnected. Attempting to reconnect...");
    setTimeout(() => {
        bot = createBotInstance();
    }, 5000);
}

function onChatCommand(username, message) {
    if (username === bot.username) return;
    if (message === "come" && username === playerUsername) teleportToPlayer();
    else if (message === "start") {
        woodCollected = 0;
        searchAndGather();
        bot.chat("Starting resource collection...");
    } else if (message === "stop") {
        bot.chat("Stopping and disconnecting.");
        bot.quit();
    } else {
        bot.chat("Command not recognized. Available commands: 'come', 'start', 'stop'.");
    }
}

function teleportToPlayer() {
    const player = bot.players[playerUsername];
    if (player && player.entity) {
        const playerPosition = player.entity.position;
        bot.chat(`Teleporting to ${playerUsername}...`);
        bot.pathfinder.setGoal(new goals.GoalNear(playerPosition.x, playerPosition.y, playerPosition.z, 1));
    } else bot.chat("Player not found or not visible.");
}

function keepAlive() {
    setInterval(() => {
        if (bot.entity && bot.entity.isValid) {
            bot.setControlState("jump", true);
            setTimeout(() => bot.setControlState("jump", false), 500);
        }
    }, 60000);
}

// Phase 1: Gather wood and start with basic tools
async function searchAndGather() {
    if (gatherAttempts >= maxGatherAttempts) {
        bot.chat("Unable to gather enough wood. Stopping.");
        return;
    }
    gatherAttempts++;

    const woodTypes = ["oak_log", "spruce_log", "birch_log", "jungle_log", "acacia_log", "dark_oak_log", "mangrove_log"];
    const tree = bot.findBlock({ matching: block => woodTypes.includes(block.name), maxDistance: 32 });
    if (tree) {
        await moveTo(tree.position);
        await bot.dig(tree);
        woodCollected++;
        bot.chat("Wood collected: " + woodCollected);
        if (woodCollected >= 5) await craftWoodenTools();
    } else {
        bot.chat("No trees nearby. Moving to a new location...");
        await moveTo(new Vec3(bot.entity.position.x + Math.floor(Math.random() * 20 - 10), bot.entity.position.y, bot.entity.position.z + Math.floor(Math.random() * 20 - 10)));
    }
    setTimeout(() => { if (woodCollected < 5) searchAndGather(); }, gatherCooldown);
}

async function craftWoodenTools() {
    const logs = bot.inventory.items().find(item => item.name.includes("log"));
    if (!logs) return;

    const plankRecipe = bot.recipesFor("planks")[0];
    if (plankRecipe) await bot.craft(plankRecipe, 4, null);

    const stickRecipe = bot.recipesFor("stick")[0];
    if (stickRecipe) await bot.craft(stickRecipe, 4, null);

    const pickaxeRecipe = bot.recipesFor("wooden_pickaxe")[0];
    if (pickaxeRecipe) {
        await bot.craft(pickaxeRecipe, 1, null);
        bot.chat("Wooden pickaxe crafted!");
        gatherStone(); // Move to the next step: gathering stone
    }
}

// Phase 2: Gather stone and upgrade tools
async function gatherStone() {
    const stone = bot.findBlock({ matching: block => block.name === "stone", maxDistance: 16 });
    if (stone) {
        await moveTo(stone.position);
        await bot.dig(stone);
        bot.chat("Stone gathered!");
        craftStoneTools();
    } else bot.chat("No stone nearby to gather.");
}

async function craftStoneTools() {
    const pickaxeRecipe = bot.recipesFor("stone_pickaxe")[0];
    if (pickaxeRecipe) {
        await bot.craft(pickaxeRecipe, 1, null);
        bot.chat("Stone pickaxe crafted!");
        gatherIron(); // Proceed to gathering iron
    }
}

// Phase 3: Gather iron and prepare for the Nether
async function gatherIron() {
    const ironOre = bot.findBlock({ matching: block => block.name === "iron_ore", maxDistance: 16 });
    if (ironOre) {
        await moveTo(ironOre.position);
        await bot.dig(ironOre);
        ironCollected++;
        bot.chat("Iron gathered: " + ironCollected);
        if (ironCollected >= 3) smeltIron();
    } else bot.chat("No iron nearby to gather.");
}

async function smeltIron() {
    // Ensure there is a furnace and fuel to smelt iron ore
    const furnaceRecipe = bot.recipesFor("furnace")[0];
    if (furnaceRecipe) await bot.craft(furnaceRecipe, 1, null);

    // Code to place furnace, add iron ore and fuel, and smelt iron
    // Assuming that fuel is available (e.g., wooden planks)
    bot.chat("Smelting iron...");
    // Proceed to Nether portal creation after smelting is complete
    createNetherPortal();
}

// Phase 4: Create a Nether Portal using bucket and lava
async function createNetherPortal() {
    bot.chat("Attempting to create a Nether portal...");
    // Logic to use water bucket on lava pools to form obsidian and build the portal frame
    // Light the portal and enter the Nether when ready
    navigateNether(); // Placeholder for entering Nether and moving to the next phase
}

// Phase 5: Navigate the Nether to find blaze rods and ender pearls
async function navigateNether() {
    bot.chat("Exploring the Nether...");
    // Logic to find a Nether fortress and gather blaze rods
    // Gather ender pearls from Piglin bartering or Endermen if available
    findStronghold();
}

// Phase 6: Locate the stronghold using Ender Eyes
async function findStronghold() {
    bot.chat("Locating the stronghold...");
    // Logic for using Ender Eyes to triangulate the stronghold's location
    fightEnderDragon();
}

// Phase 7: Engage and defeat the Ender Dragon
async function fightEnderDragon() {
    bot.chat("Engaging the Ender Dragon...");
    // Logic to destroy End Crystals and attack the Ender Dragon
}

// Move to a target position with hole detection and avoidance
async function moveTo(position) {
    const movements = new Movements(bot, bot.pathfinder);
    movements.allowSprinting = true;
    bot.pathfinder.setMovements(movements);

    const isSafe = (pos) => {
        const below = bot.blockAt(pos.offset(0, -1, 0));
        return below && below.boundingBox === "block";
    };

    if (isSafe(position)) {
        await bot.pathfinder.goto(new goals.GoalBlock(position.x, position.y, position.z));
    } else {
        bot.chat("Hole detected! Avoiding...");
        await bot.pathfinder.goto(new goals.GoalBlock(position.x + 1, position.y, position.z + 1));
    }
}
