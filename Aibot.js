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

    // Automatically teleport to the player upon spawning
    teleportToPlayer();
    
    // Start the keep-alive and gathering processes
    keepAlive();
    gatherResources();
}

function onBotEnd() {
    logAction("Bot disconnected. Attempting to reconnect...");
    setTimeout(() => {
        bot = createBotInstance();
    }, 5000);
}

// Catch unexpected disconnections or pathfinding errors and handle them gracefully
bot.on("error", (err) => {
    logAction(`Error encountered: ${err.message}`);
    moveRandomly();
});

function retryPath() {
    // Move the bot to a random nearby position as a fallback
    const randomNearbyPosition = bot.entity.position.offset(
        Math.floor(Math.random() * 10 - 5),  // Small random X offset
        0,
        Math.floor(Math.random() * 10 - 5)   // Small random Z offset
    );
    
    bot.pathfinder.setGoal(new goals.GoalBlock(randomNearbyPosition.x, randomNearbyPosition.y, randomNearbyPosition.z));
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

// Attempt to locate and move to player on spawn
async function teleportToPlayer() {
    const player = bot.players[playerUsername];
    if (player && player.entity) {
        const playerPosition = player.entity.position;
        bot.chat(`Teleporting to ${playerUsername}...`);
        let retries = 3;
        while (retries > 0) {
            try {
                await bot.pathfinder.goto(new goals.GoalNear(playerPosition.x, playerPosition.y, playerPosition.z, 1), { timeout: pathfinderTimeout });
                break; // Exit if successful
            } catch (err) {
                console.log(`Retrying... (${3 - retries + 1})`);
                retries -= 1;
                await bot.waitForTicks(20); // Wait a bit before retrying
            }
        }
        if (retries === 0) {
            bot.chat("Could not reach player after multiple attempts.");
        }
    } else {
        bot.chat("Player not found or not visible.");
    }
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
    logAction("Starting wood gathering...");
    const woodTypes = ["oak_log", "spruce_log", "birch_log", "jungle_log", "acacia_log", "dark_oak_log"];
    while (woodCollected < 5) {
        const tree = bot.findBlock({ matching: block => woodTypes.includes(block.name), maxDistance: 32 });
        if (tree) {
            await moveTo(tree.position);
            await bot.dig(tree);
            woodCollected++;
            logAction(`Wood collected: ${woodCollected}`);
        } else {
            logAction("No trees nearby. Moving to a new location...");
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

// Check for hostile mobs nearby and adjust behavior
function checkSurroundings() {
    const hostileMobs = bot.nearestEntity(entity => entity.mobType === 'Zombie' || entity.mobType === 'Skeleton');
    
    if (hostileMobs && bot.entity.position.distanceTo(hostileMobs.position) < 10) {
        bot.chat("Hostile mob detected nearby. Prioritizing defense.");
        if (bot.inventory.items().find(item => item.name === 'shield')) {
            bot.equip(bot.inventory.findInventoryItem('shield'), 'off-hand'); // Equip shield if available
        }
        evadeOrDefend(hostileMobs);
    } else if (bot.time.timeOfDay > 13000) { // Minecraft night begins at 13000
        bot.chat("Night is approaching, finding shelter.");
        seekShelter();
    }
}

function seekShelter() {
    // Find the nearest high ground or safe location to avoid mobs at night
    const safeSpot = bot.findBlock({
        matching: block => block.name === 'stone' || block.name === 'dirt',
        maxDistance: 20,
    });
    if (safeSpot) {
        moveTo(safeSpot.position);
    } else {
        moveRandomly();
    }
}

// Enhanced evade or defend logic
function evadeOrDefend(entity) {
    // Evade or attack based on distance and available equipment
    if (entity && bot.entity.position.distanceTo(entity.position) < 5) {
        bot.chat("Engaging hostile mob.");
        bot.attack(entity);
    } else {
        bot.chat("Moving to a safe distance.");
        moveRandomly();
    }
}

async function safeMoveTo(position) {
    const movements = new Movements(bot, bot.pathfinder);
    movements.allowSprinting = true;
    movements.canDig = true; // Allow the bot to dig if needed
    bot.pathfinder.setMovements(movements);

    try {
        await bot.pathfinder.goto(new goals.GoalBlock(position.x, position.y, position.z));
    } catch (error) {
        console.log("Pathfinding error: Retrying with alternative position...");
        await moveRandomly(); // Retry with a slight adjustment to avoid obstacles
    }
}

function manageInventory() {
    const essentialItems = ['wood', 'stone', 'iron', 'planks', 'stick', 'iron_ingot', 'food'];
    bot.inventory.items().forEach(item => {
        if (!essentialItems.includes(item.name)) {
            bot.tossStack(item); // Drop unnecessary items
        }
    });
}

function setupDefense() {
    bot.on('entityHurt', (entity) => {
        if (entity === bot.entity) {
            bot.chat("I've been hurt! Engaging defense mode.");
            checkSurroundings(); // Call the surroundings check function for defense response
        }
    });
}

function logAction(action) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${action}`);
    bot.chat(action); // Optional: bot announces actions in-game
}


// Phase 4: Create a Nether Portal using bucket and lava
async function createNetherPortal() {
    bot.chat("Attempting to create a Nether portal...");

    // Step 1: Gather buckets and water
    const bucketRecipe = bot.recipesFor('bucket')[0];
    if (!bucketRecipe) {
        bot.chat("Unable to craft bucket, no recipe found.");
        return;
    }

    await bot.craft(bucketRecipe, 2, null); // Craft 2 buckets (one for lava, one for water)
    bot.chat("Buckets crafted.");

    // Step 2: Locate water source and fill one bucket with water
    const waterSource = bot.findBlock({ matching: block => block.name === 'water', maxDistance: 32 });
    if (waterSource) {
        await bot.equip(bot.inventory.findInventoryItem('bucket'), 'hand');
        await bot.activateBlock(waterSource);
        bot.chat("Water collected.");
    } else {
        bot.chat("No water nearby. Aborting portal creation.");
        return;
    }

    // Step 3: Locate a lava pool
    const lavaPool = bot.findBlock({ matching: block => block.name === 'lava', maxDistance: 32 });
    if (!lavaPool) {
        bot.chat("No lava nearby. Aborting portal creation.");
        return;
    }

    // Step 4: Create obsidian using lava and water
    await bot.equip(bot.inventory.findInventoryItem('water_bucket'), 'hand');
    await moveTo(lavaPool.position);

    const portalPositions = [
        { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
        { x: 0, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
        { x: 0, y: 3, z: 0 }, { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }
    ];

    for (const offset of portalPositions) {
        const position = lavaPool.position.offset(offset.x, offset.y, offset.z);
        await bot.lookAt(position);
        await bot.activateBlock(bot.blockAt(position)); // Place water on lava to create obsidian
        await bot.waitForTicks(10); // Wait for obsidian to form
    }
    bot.chat("Nether portal frame created.");

    // Step 5: Light the portal (assuming flint and steel is available)
    const flintAndSteel = bot.inventory.items().find(item => item.name === 'flint_and_steel');
    if (flintAndSteel) {
        await bot.equip(flintAndSteel, 'hand');
        await bot.activateBlock(bot.blockAt(lavaPool.position.offset(1, 0, 0))); // Light the portal
        bot.chat("Portal lit! Entering the Nether...");
        navigateNether();
    } else {
        bot.chat("No flint and steel available to light the portal.");
    }
}

// Phase 5: Navigate the Nether to find blaze rods and ender pearls
async function navigateNether() {
    bot.chat("Exploring the Nether...");

    // Step 1: Search for Nether fortress
    const netherFortress = await searchForStructure('Nether Fortress'); // Custom function to search for a fortress
    if (!netherFortress) {
        bot.chat("Unable to locate Nether fortress.");
        return;
    }
    bot.chat("Nether fortress located!");

    // Step 2: Find and kill Blazes for blaze rods
    const blazeCount = 5; // Desired amount of blaze rods
    let rodsCollected = 0;

    while (rodsCollected < blazeCount) {
        const blaze = bot.nearestEntity(entity => entity.name === 'blaze');
        if (blaze) {
            await bot.pathfinder.goto(new goals.GoalNear(blaze.position.x, blaze.position.y, blaze.position.z, 1));
            bot.attack(blaze);
            rodsCollected++;
            bot.chat(`Blaze rod collected: ${rodsCollected}/${blazeCount}`);
        } else {
            bot.chat("No blaze nearby.");
            await bot.waitForTicks(20); // Wait and search again
        }
    }

    // Step 3: Find Piglins for ender pearls or kill Endermen
    let pearlsCollected = 0;
    const pearlGoal = 12; // Desired amount of ender pearls

    while (pearlsCollected < pearlGoal) {
        const enderman = bot.nearestEntity(entity => entity.name === 'enderman');
        if (enderman) {
            await bot.pathfinder.goto(new goals.GoalNear(enderman.position.x, enderman.position.y, enderman.position.z, 1));
            bot.attack(enderman);
            pearlsCollected++;
            bot.chat(`Ender pearl collected: ${pearlsCollected}/${pearlGoal}`);
        } else {
            bot.chat("No Endermen found. Searching for Piglins...");
            await bot.waitForTicks(20);
            // Add Piglin bartering logic if desired
        }
    }
    bot.chat("Blaze rods and ender pearls collected. Returning to Overworld.");
    findStronghold();
}

// Phase 6: Locate the stronghold using Ender Eyes
async function findStronghold() {
    bot.chat("Locating the stronghold...");

    const eyeOfEnder = bot.inventory.items().find(item => item.name === 'ender_eye');
    if (!eyeOfEnder) {
        bot.chat("No Eyes of Ender in inventory.");
        return;
    }

    // Step 1: Throw Eye of Ender and follow its direction
    while (true) {
        bot.chat("Throwing Eye of Ender...");
        bot.equip(eyeOfEnder, 'hand');
        bot.activateItem(); // Throws Eye of Ender
        await bot.waitForTicks(40); // Wait for Eye to float and fall

        // Step 2: Follow the Eye of Ender's direction
        const newLocation = bot.entity.position.offset(10, 0, 10); // Simplified; adjust based on Eye's direction
        await moveTo(newLocation);
        
        // Repeat until the stronghold is found
        if (isStrongholdNearby()) {
            bot.chat("Stronghold located!");
            break;
        }
    }

    fightEnderDragon();
}

// Phase 7: Engage and defeat the Ender Dragon
async function fightEnderDragon() {
    bot.chat("Engaging the Ender Dragon...");

    // Step 1: Destroy End Crystals to weaken the dragon
    let crystalsDestroyed = 0;
    const endCrystals = bot.findEntities({ type: 'end_crystal' });
    
    for (const crystal of endCrystals) {
        await bot.pathfinder.goto(new goals.GoalNear(crystal.position.x, crystal.position.y, crystal.position.z, 1));
        bot.attack(crystal);
        crystalsDestroyed++;
        bot.chat(`End Crystal destroyed: ${crystalsDestroyed}`);
    }
    bot.chat("All End Crystals destroyed.");

    // Step 2: Attack the Ender Dragon when it perches or flies nearby
    const dragon = bot.nearestEntity(entity => entity.name === 'ender_dragon');
    while (dragon && dragon.health > 0) {
        if (dragon.position.distanceTo(bot.entity.position) < 10) {
            bot.chat("Attacking Ender Dragon...");
            bot.attack(dragon);
            await bot.waitForTicks(20);
        } else {
            bot.chat("Waiting for the dragon to approach...");
            await bot.waitForTicks(40);
        }
    }

    bot.chat("Ender Dragon defeated! Speedrun complete.");
}

// Helper function to move bot to a target position safely
async function moveTo(position) {
    const movements = new Movements(bot, bot.pathfinder);
    bot.pathfinder.setMovements(movements);
    await bot.pathfinder.goto(new goals.GoalBlock(position.x, position.y, position.z));
}

// Helper function to simulate stronghold detection
function isStrongholdNearby() {
    // Placeholder logic for detecting a stronghold
    return Math.random() > 0.8; // 20% chance of detecting stronghold in each loop for demonstration
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
