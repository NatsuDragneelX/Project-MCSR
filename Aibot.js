const mineflayer = require("mineflayer");
const { goals } = require("mineflayer-pathfinder");
const { pathfinder, Movements } = require("mineflayer-pathfinder");
const { Vec3 } = require("vec3");

const playerUsername = "NatsuDragonX";
let bot = createBotInstance();
let gatherAttempts = 0;
const maxGatherAttempts = 5;
const gatherCooldown = 5000;
let woodCollected = 0;
let stoneCollected = 0;
let ironCollected = 0;

function createBotInstance() {
    const botInstance = mineflayer.createBot({
        username: "SpeedRunnerBot",
        host: "localhost",
        port: 25565, 
    });

    botInstance.loadPlugin(pathfinder);
    botInstance.once("spawn", onBotSpawn);
    botInstance.on("end", onBotEnd);
    botInstance.on("kicked", (reason) => console.log("Bot was kicked:", reason));
    botInstance.on("error", (err) => console.log("Bot encountered an error:", err));
    botInstance.on("chat", onChatCommand);
    botInstance.on("path_update", onPathUpdate);  // Pathfinding progress and error handling

    return botInstance;
}

function onBotSpawn() {
    console.log("Bot has spawned and is starting the speedrun process.");
    bot.chat("Starting resource gathering for speedrun...");
    gatherResources();
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
        gatherResources();
        bot.chat("Starting resource collection...");
    } else if (message === "stop") {
        bot.chat("Stopping and disconnecting.");
        bot.quit();
    } else {
        bot.chat("Command not recognized. Available commands: 'come', 'start', 'stop'.");
    }
}

// Pathfinding Error Handling
function onPathUpdate(result) {
    if (result.status === 'noPath') {
        console.log("Pathfinding timeout: Could not find a path to the goal. Retrying...");
        bot.chat("Pathfinding error: Reattempting move...");
        moveRandomly(); // Move to a nearby location as a fallback
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

async function gatherResources() {
    await gatherWood();
    await gatherStone();
    await gatherIron();
    craftEssentials();
}

async function gatherWood() {
    const woodTypes = ["oak_log", "spruce_log", "birch_log", "jungle_log", "acacia_log", "dark_oak_log"];
    while (woodCollected < 5) {
        const tree = bot.findBlock({ matching: block => woodTypes.includes(block.name), maxDistance: 32 });
        if (tree) {
            await moveTo(tree.position);
            await bot.dig(tree);
            woodCollected++;
            bot.chat(`Wood collected: ${woodCollected}`);
        } else {
            bot.chat("No trees nearby. Moving to a new location...");
            await moveRandomly();
        }
    }
}

async function gatherStone() {
    while (stoneCollected < 10) {
        const stone = bot.findBlock({ matching: block => block.name === "stone", maxDistance: 16 });
        if (stone) {
            await moveTo(stone.position);
            await bot.dig(stone);
            stoneCollected++;
            bot.chat(`Stone collected: ${stoneCollected}`);
        } else {
            bot.chat("No stone nearby. Moving to a new location...");
            await moveRandomly();
        }
    }
}

async function gatherIron() {
    while (ironCollected < 10) {
        const ironOre = bot.findBlock({ matching: block => block.name === "iron_ore", maxDistance: 16 });
        if (ironOre) {
            await moveTo(ironOre.position);
            await bot.dig(ironOre);
            ironCollected++;
            bot.chat(`Iron gathered: ${ironCollected}`);
        } else {
            bot.chat("No iron nearby. Moving to a new location...");
            await moveRandomly();
        }
    }
}

async function craftEssentials() {
    if (woodCollected >= 5) await craftWoodenTools();
    if (stoneCollected >= 3) await craftStoneTools();
    if (ironCollected >= 3) await smeltIronAndCraftIronTools();
}

async function craftWoodenTools() {
    const plankRecipe = bot.recipesFor("planks")[0];
    if (plankRecipe) await bot.craft(plankRecipe, 4, null);

    const stickRecipe = bot.recipesFor("stick")[0];
    if (stickRecipe) await bot.craft(stickRecipe, 4, null);

    const pickaxeRecipe = bot.recipesFor("wooden_pickaxe")[0];
    if (pickaxeRecipe) {
        await bot.craft(pickaxeRecipe, 1, null);
        bot.chat("Wooden pickaxe crafted!");
    }
}

async function craftStoneTools() {
    const pickaxeRecipe = bot.recipesFor("stone_pickaxe")[0];
    if (pickaxeRecipe) {
        await bot.craft(pickaxeRecipe, 1, null);
        bot.chat("Stone pickaxe crafted!");
    }

    const swordRecipe = bot.recipesFor("stone_sword")[0];
    if (swordRecipe) {
        await bot.craft(swordRecipe, 1, null);
        bot.chat("Stone sword crafted!");
    }
}

async function smeltIronAndCraftIronTools() {
    const furnaceRecipe = bot.recipesFor("furnace")[0];
    if (furnaceRecipe) await bot.craft(furnaceRecipe, 1, null);

    bot.chat("Smelting iron...");
    const pickaxeRecipe = bot.recipesFor("iron_pickaxe")[0];
    if (pickaxeRecipe) await bot.craft(pickaxeRecipe, 1, null);
    
    const swordRecipe = bot.recipesFor("iron_sword")[0];
    if (swordRecipe) await bot.craft(swordRecipe, 1, null);

    if (ironCollected >= 8) {
        const chestplateRecipe = bot.recipesFor("iron_chestplate")[0];
        if (chestplateRecipe) await bot.craft(chestplateRecipe, 1, null);
        bot.chat("Iron chestplate crafted!");
    }
}

// Move to a target position with error handling for pathfinding issues
async function moveTo(position) {
    const movements = new Movements(bot, bot.pathfinder);
    movements.allowSprinting = true;
    bot.pathfinder.setMovements(movements);

    try {
        await bot.pathfinder.goto(new goals.GoalBlock(position.x, position.y, position.z));
    } catch (error) {
        console.log("Pathfinding error: Could not reach the position. Retrying...");
        bot.chat("Pathfinding error. Moving randomly.");
        await moveRandomly();
    }
}

async function moveRandomly() {
    const randomX = bot.entity.position.x + Math.floor(Math.random() * 20 - 10);
    const randomZ = bot.entity.position.z + Math.floor(Math.random() * 20 - 10);
    await moveTo(new Vec3(randomX, bot.entity.position.y, randomZ));
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
