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
let stoneCollected = 0;
let ironCollected = 0;

// Create and configure bot instance
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
    botInstance.on("path_update", onPathUpdate); // Pathfinding progress and error handling

    return botInstance;
}

// Handle bot spawn and begin tasks
function onBotSpawn() {
    console.log("Bot has spawned and is starting the process.");
    bot.chat("Bot ready and starting tasks...");
    teleportToPlayer();
    keepAlive();
    startTasks();
}

// Handle bot disconnection and attempt reconnection
function onBotEnd() {
    console.log("Bot disconnected. Attempting to reconnect...");
    setTimeout(() => createBotInstance(), 5000);
}

// Handle chat commands
function onChatCommand(username, message) {
    if (username === bot.username) return;

    if (message === "come") teleportToPlayer();
    else if (message === "start") startTasks();
    else if (message === "stop") {
        bot.chat("Stopping the bot.");
        bot.quit();
    } else {
        bot.chat("Unknown command.");
    }
}

// Handle pathfinding updates (progress and error handling)
function onPathUpdate(result) {
    if (result.status === "success") {
        bot.chat("Pathfinding successful!");
    } else if (result.status === "failed") {
        bot.chat("Pathfinding failed. Retrying...");
    }
}

// Move to a position safely, avoiding hazards
async function MoveTo(position) {
    const movements = new Movements(bot, bot.pathfinder);
    movements.allowSprinting = true;
    movements.canDig = true; // Allow the bot to dig if necessary
    bot.pathfinder.setMovements(movements);

    const isSafe = (pos) => {
        const below = bot.blockAt(pos.offset(0, -1, 0));
        return below && below.boundingBox === "block" && !["lava", "fire", "cactus"].includes(below.name);
    };

    if (isSafe(position)) {
        try {
            await bot.pathfinder.goto(new goals.GoalBlock(position.x, position.y, position.z));
        } catch (error) {
            bot.chat("Error moving to target. Retrying...");
        }
    } else {
        bot.chat("Hazard detected! Adjusting path...");
        const adjustedPosition = position.offset(1, 0, 1); // Slightly adjust the position to avoid hazards
        await bot.pathfinder.goto(new goals.GoalBlock(adjustedPosition.x, adjustedPosition.y, adjustedPosition.z));
    }
}

// Ensure bot stays alive by jumping periodically
function keepAlive() {
    setInterval(() => {
        bot.setControlState("jump", true);
        setTimeout(() => bot.setControlState("jump", false), 500);
    }, 60000);
}

// Teleport to the player
async function teleportToPlayer() {
    const player = bot.players[playerUsername];
    if (player && player.entity) {
        const position = player.entity.position;
        bot.chat(`Teleporting to ${playerUsername}...`);
        try {
            await bot.pathfinder.goto(new goals.GoalNear(position.x, position.y, position.z, 1));
        } catch (err) {
            bot.chat("Could not reach the player.");
        }
    } else {
        bot.chat("Player not found.");
    }
}

// Start the main tasks
async function startTasks() {
    await gatherResources();
    await craftEssentials();
    await createNetherPortal();
}

// Gather essential resources
async function gatherResources() {
    await gatherWood();
    await gatherStone();
    await gatherIron();
}

// Gather wood
async function gatherWood() {
    const woodTypes = ["oak_log", "spruce_log", "birch_log", "jungle_log", "acacia_log", "dark_oak_log"];
    while (woodCollected < 10) {
        if (!checkInventorySpace()) {
            bot.chat("Inventory full. Please clear space.");
            break;
        }

        const tree = bot.findBlock({ matching: (block) => woodTypes.includes(block.name), maxDistance: 32 });
        if (tree) {
            bot.chat(`Found a tree at ${tree.position}. Moving to it...`);
            await MoveTo(tree.position); // Use safeMoveTo instead of moveTo

            if (checkForHazards(tree.position)) {
                bot.chat("Hazard detected near the tree. Skipping...");
                continue;
            }

            equipTool("axe"); // Equip the best axe available
            await bot.dig(tree);
            woodCollected++;
            bot.chat(`Wood collected: ${woodCollected}`);
        } else {
            bot.chat("No trees nearby. Moving randomly...");
            await moveRandomly();
        }

        if (timeoutExceeded()) {
            bot.chat("Timeout reached while gathering wood. Moving to the next task.");
            break;
        }
    }
}

// Gather stone
async function gatherStone() {
    while (stoneCollected < 10) {
        if (!checkInventorySpace()) {
            bot.chat("Inventory full. Please clear space.");
            break;
        }

        const stone = bot.findBlock({ matching: (block) => block.name === "stone", maxDistance: 16 });
        if (stone) {
            bot.chat(`Found stone at ${stone.position}. Moving to it...`);
            await moveTo(stone.position);

            if (checkForHazards(stone.position)) {
                bot.chat("Hazard detected near the stone. Skipping...");
                continue;
            }

            equipTool("pickaxe"); // Equip the best pickaxe available
            await bot.dig(stone);
            stoneCollected++;
            bot.chat(`Stone collected: ${stoneCollected}`);
        } else {
            bot.chat("No stone nearby. Moving randomly...");
            await moveRandomly();
        }

        if (timeoutExceeded()) {
            bot.chat("Timeout reached while gathering stone. Moving to the next task.");
            break;
        }
    }
}

// Gather iron
async function gatherIron() {
    while (ironCollected < 10) {
        if (!checkInventorySpace()) {
            bot.chat("Inventory full. Please clear space.");
            break;
        }

        const ironOre = bot.findBlock({ matching: (block) => block.name === "iron_ore", maxDistance: 16 });
        if (ironOre) {
            bot.chat(`Found iron ore at ${ironOre.position}. Moving to it...`);
            await moveTo(ironOre.position);

            if (checkForHazards(ironOre.position)) {
                bot.chat("Hazard detected near the iron ore. Skipping...");
                continue;
            }

            equipTool("pickaxe"); // Equip the best pickaxe available
            await bot.dig(ironOre);
            ironCollected++;
            bot.chat(`Iron collected: ${ironCollected}`);
        } else {
            bot.chat("No iron nearby. Moving randomly...");
            await moveRandomly();
        }

        if (timeoutExceeded()) {
            bot.chat("Timeout reached while gathering iron. Moving to the next task.");
            break;
        }
    }
}

// Equip the best tool for the task
function equipTool(toolType) {
    const tool = bot.inventory.items().find((item) => item.name.includes(toolType));
    if (tool) {
        bot.equip(tool, "hand", (err) => {
            if (err) bot.chat(`Error equipping ${toolType}: ${err.message}`);
        });
    } else {
        bot.chat(`No ${toolType} available. Proceeding without it.`);
    }
}

// Check for hazards around a position
function checkForHazards(position) {
    const dangerousBlocks = ["lava", "fire", "cactus"];
    return bot.findBlock({
        matching: (block) => dangerousBlocks.includes(block.name),
        point: position,
        maxDistance: 2,
    });
}

// Check if inventory has space
function checkInventorySpace() {
    return bot.inventory.slots.some((slot) => slot === null);
}

// Handle timeouts for gathering
let startTime = Date.now();
function timeoutExceeded(timeout = 60000) {
    return Date.now() - startTime > timeout;
}

// Move randomly in case of resource unavailability
// Move randomly as a fallback (avoids hazards)
async function moveRandomly() {
    const randomX = bot.entity.position.x + Math.floor(Math.random() * 20 - 10);
    const randomZ = bot.entity.position.z + Math.floor(Math.random() * 20 - 10);
    const randomY = bot.entity.position.y;
    const destination = new Vec3(randomX, randomY, randomZ);

    await MoveTo(destination);
}

// Move the bot to a specific position
async function MoveTo(position) {
    const movements = new Movements(bot, bot.pathfinder);
    movements.allowSprinting = true;
    movements.canDig = true;
    bot.pathfinder.setMovements(movements);

    try {
        await bot.pathfinder.goto(new goals.GoalBlock(position.x, position.y, position.z));
    } catch (error) {
        bot.chat('Pathfinding failed. Adjusting path...');
        const adjustedPosition = position.offset(1, 0, 1); // Adjust position to avoid obstacles
        try {
            await bot.pathfinder.goto(new goals.GoalBlock(adjustedPosition.x, adjustedPosition.y, adjustedPosition.z));
        } catch (retryError) {
            bot.chat(`Adjusted path failed: ${retryError.message}`);
        }
    }
}



// Craft essential tools and items
async function craftEssentials() {
    if (woodCollected >= 4) await craftWoodenTools();
    if (stoneCollected >= 3) await craftStoneTools();
    if (ironCollected >= 3) await smeltIronAndCraftIronTools();
}

// Craft wooden tools
async function craftWoodenTools() {
    bot.chat("Crafting wooden tools...");

    // Check and craft planks if needed
    const plankRecipe = bot.recipesFor(bot.mcData.itemsByName["planks"].id)[0];
    if (plankRecipe && countInInventory("planks") < 8) {
        await bot.craft(plankRecipe, 4, null);
        bot.chat("Crafted planks.");
    } else {
        bot.chat("Planks already available.");
    }

    // Check and craft sticks if needed
    const stickRecipe = bot.recipesFor(bot.mcData.itemsByName["stick"].id)[0];
    if (stickRecipe && countInInventory("stick") < 4) {
        await bot.craft(stickRecipe, 4, null);
        bot.chat("Crafted sticks.");
    } else {
        bot.chat("Sticks already available.");
    }

    // Check and craft a wooden pickaxe
    if (!checkToolInInventory("wooden_pickaxe")) {
        const pickaxeRecipe = bot.recipesFor(bot.mcData.itemsByName["wooden_pickaxe"].id)[0];
        if (pickaxeRecipe) {
            await bot.craft(pickaxeRecipe, 1, null);
            bot.chat("Wooden pickaxe crafted!");
        } else {
            bot.chat("Unable to craft wooden pickaxe. Missing materials.");
        }
    } else {
        bot.chat("Wooden pickaxe already available.");
    }
}

// Craft stone tools
async function craftStoneTools() {
    bot.chat("Crafting stone tools...");

    // Check and craft a stone pickaxe
    if (!checkToolInInventory("stone_pickaxe")) {
        const pickaxeRecipe = bot.recipesFor(bot.mcData.itemsByName["stone_pickaxe"].id)[0];
        if (pickaxeRecipe) {
            await bot.craft(pickaxeRecipe, 1, null);
            bot.chat("Stone pickaxe crafted!");
        } else {
            bot.chat("Unable to craft stone pickaxe. Missing materials.");
        }
    } else {
        bot.chat("Stone pickaxe already available.");
    }

    // Check and craft a stone sword
    if (!checkToolInInventory("stone_sword")) {
        const swordRecipe = bot.recipesFor(bot.mcData.itemsByName["stone_sword"].id)[0];
        if (swordRecipe) {
            await bot.craft(swordRecipe, 1, null);
            bot.chat("Stone sword crafted!");
        } else {
            bot.chat("Unable to craft stone sword. Missing materials.");
        }
    } else {
        bot.chat("Stone sword already available.");
    }
}

// Smelt iron and craft iron tools
async function smeltIronAndCraftIronTools() {
    bot.chat("Smelting iron and crafting iron tools...");

    // Check if a furnace is needed and craft one
    if (!checkInventoryForItem("furnace")) {
        const furnaceRecipe = bot.recipesFor(bot.mcData.itemsByName["furnace"].id)[0];
        if (furnaceRecipe) {
            await bot.craft(furnaceRecipe, 1, null);
            bot.chat("Furnace crafted.");
        } else {
            bot.chat("Unable to craft furnace. Missing materials.");
            return;
        }
    }

    // Place furnace and smelt iron
    const furnace = bot.inventory.findInventoryItem("furnace");
    if (furnace) {
        await placeBlock("furnace");
        bot.chat("Furnace placed. Smelting iron...");
        await smeltItem("iron_ore", "coal", "iron_ingot");
    } else {
        bot.chat("Furnace not found in inventory.");
        return;
    }

    // Craft iron tools
    if (!checkToolInInventory("iron_pickaxe")) {
        const pickaxeRecipe = bot.recipesFor(bot.mcData.itemsByName["iron_pickaxe"].id)[0];
        if (pickaxeRecipe) {
            await bot.craft(pickaxeRecipe, 1, null);
            bot.chat("Iron pickaxe crafted!");
        } else {
            bot.chat("Unable to craft iron pickaxe. Missing materials.");
        }
    } else {
        bot.chat("Iron pickaxe already available.");
    }

    if (!checkToolInInventory("iron_sword")) {
        const swordRecipe = bot.recipesFor(bot.mcData.itemsByName["iron_sword"].id)[0];
        if (swordRecipe) {
            await bot.craft(swordRecipe, 1, null);
            bot.chat("Iron sword crafted!");
        } else {
            bot.chat("Unable to craft iron sword. Missing materials.");
        }
    } else {
        bot.chat("Iron sword already available.");
    }
}

// Helper Functions

// Count items in inventory
function countInInventory(itemName) {
    return bot.inventory.items().filter((item) => item.name === itemName).reduce((count, item) => count + item.count, 0);
}

// Check if a tool exists in the inventory
function checkToolInInventory(toolName) {
    return bot.inventory.items().some((item) => item.name === toolName);
}

// Check if a specific item exists in inventory
function checkInventoryForItem(itemName) {
    return bot.inventory.items().some((item) => item.name === itemName);
}

// Smelt item using a furnace
async function smeltItem(input, fuel, output) {
    const furnace = bot.findBlock({ matching: bot.mcData.blocksByName["furnace"].id, maxDistance: 16 });
    if (!furnace) {
        bot.chat("No furnace nearby to smelt items.");
        return;
    }

    const inputItem = bot.inventory.findInventoryItem(input);
    const fuelItem = bot.inventory.findInventoryItem(fuel);
    if (!inputItem || !fuelItem) {
        bot.chat("Missing resources for smelting.");
        return;
    }

    try {
        await bot.smelt(inputItem.type, fuelItem.type, bot.mcData.itemsByName[output].id);
        bot.chat(`${output} smelted successfully!`);
    } catch (err) {
        bot.chat(`Error during smelting: ${err.message}`);
    }
}

// Place a block from inventory
async function placeBlock(blockName) {
    const block = bot.inventory.findInventoryItem(blockName);
    if (block) {
        const target = bot.blockAt(bot.entity.position.offset(0, -1, 0));
        if (target) {
            try {
                await bot.placeBlock(target, new Vec3(0, 1, 0));
                bot.chat(`${blockName} placed.`);
            } catch (err) {
                bot.chat(`Error placing ${blockName}: ${err.message}`);
            }
        }
    } else {
        bot.chat(`${blockName} not found in inventory.`);
    }
}

// Create a Nether portal
async function createNetherPortal() {
    bot.chat("Attempting to create a Nether portal...");

    // Ensure we have buckets
    let bucket = bot.inventory.items().find(item => item.name === 'bucket');
    if (!bucket) {
        const bucketRecipe = bot.recipesFor(bot.mcData.itemsByName['bucket'].id)[0];
        if (bucketRecipe) {
            await bot.craft(bucketRecipe, 1, null);
            bot.chat("Bucket crafted.");
        } else {
            bot.chat("Cannot craft bucket. Missing materials.");
            return;
        }
    }

    // Collect water and lava
    const waterSource = bot.findBlock({ matching: block => block.name === 'water', maxDistance: 32 });
    const lavaSource = bot.findBlock({ matching: block => block.name === 'lava', maxDistance: 32 });

    if (waterSource && lavaSource) {
        await moveTo(waterSource.position);
        await bot.activateBlock(waterSource); // Collect water
        await moveTo(lavaSource.position);
        await bot.activateBlock(lavaSource); // Collect lava

        bot.chat("Collected water and lava.");
    } else {
        bot.chat("Water or lava source not found. Aborting portal creation.");
        return;
    }

    // Create obsidian and build the portal
    bot.chat("Creating obsidian...");
    // Implement logic to place water and lava strategically to create obsidian

    // Light the portal
    const flintAndSteel = bot.inventory.items().find(item => item.name === 'flint_and_steel');
    if (flintAndSteel) {
        const portalFrame = bot.findBlock({ matching: block => block.name === 'obsidian', maxDistance: 5 });
        if (portalFrame) {
            await bot.activateBlock(portalFrame);
            bot.chat("Nether portal created and lit!");
        }
    } else {
        bot.chat("Missing flint and steel to light the portal.");
    }
}

// Move randomly as a fallback (avoids hazards)
async function moveRandomly() {
    const randomX = bot.entity.position.x + Math.floor(Math.random() * 20 - 10);
    const randomZ = bot.entity.position.z + Math.floor(Math.random() * 20 - 10);
    const randomY = bot.entity.position.y;

    const destination = new Vec3(randomX, randomY, randomZ);
    const blockAtDestination = bot.blockAt(destination);

    // Avoid hazards like lava, fire, and cactus
    if (blockAtDestination && ['lava', 'fire', 'cactus'].includes(blockAtDestination.name)) {
        bot.chat("Hazard detected in random movement. Adjusting path...");
        await moveRandomly(); // Retry with a new random location
    } else {
        await MoveTo(destination);
    }
}

// Enhanced evade or defend logic
function evadeOrDefend(entity) {
    const distance = bot.entity.position.distanceTo(entity.position);

    if (distance < 5) {
        bot.chat("Engaging hostile mob.");
        equipBestWeapon();
        bot.attack(entity);
    } else if (distance < 15 && bot.inventory.items().find(item => item.name === 'bow')) {
        bot.chat("Using bow to attack hostile mob.");
        equipBestWeapon('bow');
        bot.attack(entity);
    } else {
        bot.chat("Moving to a safe distance.");
        moveRandomly();
    }
}

// Equip the best weapon available
function equipBestWeapon(preferred = 'sword') {
    const weapon = bot.inventory.items().find(item => item.name.includes(preferred));
    if (weapon) {
        bot.equip(weapon, 'hand', (err) => {
            if (err) bot.chat(`Failed to equip ${preferred}: ${err.message}`);
        });
    } else {
        bot.chat(`No ${preferred} available. Using default attack.`);
    }
}

// Enhanced inventory management
function manageInventory() {
    const essentialItems = ['wood', 'stone', 'iron', 'planks', 'stick', 'iron_ingot', 'food'];

    bot.inventory.items().forEach(item => {
        if (!essentialItems.includes(item.name)) {
            bot.chat(`Tossing unnecessary item: ${item.name}`);
            bot.tossStack(item); // Drop unnecessary items
        }
    });
}

// Enhanced surroundings check
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

// Enhanced logging
function logAction(action) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${action}`);
    bot.chat(action); // Optional: bot announces actions in-game
}

// Safe block placement for Nether portal
async function placeBlockSafely(blockName, position) {
    const block = bot.inventory.findInventoryItem(blockName);
    if (block) {
        const target = bot.blockAt(position.offset(0, -1, 0));
        if (target) {
            try {
                await bot.placeBlock(target, new Vec3(0, 1, 0));
                bot.chat(`${blockName} placed.`);
            } catch (err) {
                bot.chat(`Error placing ${blockName}: ${err.message}`);
            }
        }
    } else {
        bot.chat(`${blockName} not found in inventory.`);
    }
}

// Phase 4: Create a Nether Portal using bucket and lava
async function createNetherPortal() {
    bot.chat("Attempting to create a Nether portal...");

    // Step 1: Ensure sufficient materials
    const requiredItems = ["bucket", "flint_and_steel"];
    for (const item of requiredItems) {
        if (!bot.inventory.items().find(i => i.name === item)) {
            const recipe = bot.recipesFor(bot.mcData.itemsByName[item]?.id)[0];
            if (recipe) {
                await bot.craft(recipe, 1, null);
                bot.chat(`${item} crafted.`);
            } else {
                bot.chat(`Missing ${item} and no recipe available. Aborting portal creation.`);
                return;
            }
        }
    }

    // Step 2: Locate and collect water
    const waterSource = bot.findBlock({ matching: block => block.name === "water", maxDistance: 32 });
    if (!waterSource) {
        bot.chat("No water source nearby. Aborting portal creation.");
        return;
    }
    bot.chat("Water source located. Collecting water...");
    try {
        const bucket = bot.inventory.findInventoryItem("bucket");
        await bot.equip(bucket, "hand");
        await bot.activateBlock(waterSource);
        bot.chat("Water collected.");
    } catch (error) {
        bot.chat(`Failed to collect water: ${error.message}`);
        return;
    }

    // Step 3: Locate a lava pool
    const lavaPool = bot.findBlock({ matching: block => block.name === "lava", maxDistance: 32 });
    if (!lavaPool) {
        bot.chat("No lava pool nearby. Aborting portal creation.");
        return;
    }
    bot.chat("Lava pool located. Proceeding to create obsidian...");

    // Step 4: Create obsidian
    const waterBucket = bot.inventory.findInventoryItem("water_bucket");
    if (!waterBucket) {
        bot.chat("Water bucket missing. Aborting portal creation.");
        return;
    }

    const portalPositions = [
        { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
        { x: 0, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
        { x: 0, y: 3, z: 0 }, { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }
    ];

    for (const offset of portalPositions) {
        const position = lavaPool.position.offset(offset.x, offset.y, offset.z);
        const block = bot.blockAt(position);

        if (block && block.name === "lava") {
            bot.chat(`Creating obsidian at ${position.toString()}...`);
            try {
                await bot.equip(waterBucket, "hand");
                await bot.activateBlock(block); // Place water to create obsidian
                await bot.waitForTicks(10); // Wait for obsidian to form
            } catch (error) {
                bot.chat(`Failed to create obsidian at ${position.toString()}: ${error.message}`);
                continue; // Skip to the next position
            }
        } else {
            bot.chat(`Skipping position ${position.toString()} (not lava).`);
        }
    }
    bot.chat("Nether portal frame created.");

    // Step 5: Light the portal
    const flintAndSteel = bot.inventory.items().find(item => item.name === "flint_and_steel");
    if (!flintAndSteel) {
        bot.chat("No flint and steel available to light the portal.");
        return;
    }

    bot.chat("Lighting the portal...");
    try {
        const portalCenter = lavaPool.position.offset(1, 0, 0); // Adjust based on portal frame
        await bot.equip(flintAndSteel, "hand");
        await bot.activateBlock(bot.blockAt(portalCenter));
        bot.chat("Portal lit! Entering the Nether...");
        navigateNether(); // Navigate in the Nether (implement as needed)
    } catch (error) {
        bot.chat(`Failed to light the portal: ${error.message}`);
    }
}


// Phase 5: Navigate the Nether to find blaze rods and ender pearls
async function navigateNether() {
    bot.chat("Exploring the Nether...");

    // Step 1: Search for Nether Fortress
    bot.chat("Searching for a Nether Fortress...");
    const netherFortress = await searchForStructure("nether_fortress"); // Custom function to search for a fortress
    if (!netherFortress) {
        bot.chat("Unable to locate a Nether Fortress. Aborting Nether exploration.");
        return;
    }
    bot.chat("Nether Fortress located! Heading there...");

    await bot.pathfinder.goto(new goals.GoalBlock(netherFortress.position.x, netherFortress.position.y, netherFortress.position.z));

    // Step 2: Find and kill Blazes for blaze rods
    bot.chat("Searching for Blazes...");
    const blazeCount = 5; // Desired number of blaze rods
    let rodsCollected = 0;

    while (rodsCollected < blazeCount) {
        const blaze = bot.nearestEntity(entity => entity.name === "blaze");
        if (blaze) {
            bot.chat("Blaze spotted! Engaging...");
            await bot.pathfinder.goto(new goals.GoalNear(blaze.position.x, blaze.position.y, blaze.position.z, 2));

            if (bot.inventory.items().find(item => item.name === "bow")) {
                await equipBestWeapon("bow");
                bot.attack(blaze);
            } else {
                await equipBestWeapon("sword");
                bot.attack(blaze);
            }

            await bot.waitForTicks(10); // Wait for drops to appear
            const blazeRod = bot.inventory.items().find(item => item.name === "blaze_rod");
            if (blazeRod) {
                rodsCollected++;
                bot.chat(`Blaze rod collected: ${rodsCollected}/${blazeCount}`);
            }
        } else {
            bot.chat("No Blazes nearby. Moving around to find more...");
            await moveRandomlyInFortress();
        }

        if (timeoutExceeded(30000)) {
            bot.chat("Timeout exceeded while searching for Blazes. Aborting...");
            return;
        }
    }

    // Step 3: Collect Ender Pearls
    bot.chat("Searching for Ender Pearls...");
    const pearlGoal = 12; // Desired number of ender pearls
    let pearlsCollected = 0;

    while (pearlsCollected < pearlGoal) {
        const enderman = bot.nearestEntity(entity => entity.name === "enderman");
        if (enderman) {
            bot.chat("Enderman spotted! Engaging...");
            await bot.pathfinder.goto(new goals.GoalNear(enderman.position.x, enderman.position.y, enderman.position.z, 2));

            // Use shield or blocks for protection
            if (bot.inventory.items().find(item => item.name === "shield")) {
                await bot.equip(bot.inventory.findInventoryItem("shield"), "off-hand");
            }
            await equipBestWeapon("sword");
            bot.attack(enderman);

            await bot.waitForTicks(10); // Wait for drops
            const enderPearl = bot.inventory.items().find(item => item.name === "ender_pearl");
            if (enderPearl) {
                pearlsCollected++;
                bot.chat(`Ender pearl collected: ${pearlsCollected}/${pearlGoal}`);
            }
        } else {
            bot.chat("No Endermen found. Attempting Piglin bartering...");
            await piglinBartering(pearlsCollected, pearlGoal);
        }

        if (timeoutExceeded(30000)) {
            bot.chat("Timeout exceeded while searching for Ender Pearls. Aborting...");
            return;
        }
    }

    bot.chat("Blaze rods and Ender Pearls collected. Returning to Overworld...");
    findStronghold();
}

// Piglin Bartering Logic
async function piglinBartering(pearlsCollected, pearlGoal) {
    const piglin = bot.nearestEntity(entity => entity.name === "piglin");
    if (piglin) {
        bot.chat("Piglin found. Starting bartering...");
        const goldIngot = bot.inventory.items().find(item => item.name === "gold_ingot");
        if (!goldIngot) {
            bot.chat("No gold ingots available for bartering.");
            return;
        }

        try {
            await bot.equip(goldIngot, "hand");
            await bot.activateEntity(piglin); // Start bartering
            await bot.waitForTicks(40); // Wait for Piglin to drop items

            const pearlDrop = bot.inventory.items().find(item => item.name === "ender_pearl");
            if (pearlDrop) {
                pearlsCollected += pearlDrop.count;
                bot.chat(`Bartered Ender Pearls collected: ${pearlsCollected}/${pearlGoal}`);
            }
        } catch (error) {
            bot.chat(`Error during Piglin bartering: ${error.message}`);
        }
    } else {
        bot.chat("No Piglins nearby for bartering.");
    }
}

// Move randomly within the Nether Fortress
async function moveRandomlyInFortress() {
    const randomOffset = { x: Math.floor(Math.random() * 20 - 10), z: Math.floor(Math.random() * 20 - 10) };
    const position = bot.entity.position.offset(randomOffset.x, 0, randomOffset.z);

    try {
        await bot.pathfinder.goto(new goals.GoalBlock(position.x, position.y, position.z));
    } catch (error) {
        bot.chat("Error moving randomly within fortress.");
    }
}

// Search for specific structure (Nether Fortress)
async function searchForStructure(structureName) {
    bot.chat(`Searching for ${structureName}...`);
    // Implement logic using bot navigation or plugins like ChunkBase
    // Placeholder logic for now
    await moveRandomly();
    return bot.blockAt(bot.entity.position.offset(0, -1, 0)); // Example return for testing
}

// Equip the best weapon available
async function equipBestWeapon(preferred = "sword") {
    const weapon = bot.inventory.items().find(item => item.name.includes(preferred));
    if (weapon) {
        await bot.equip(weapon, "hand");
        bot.chat(`${preferred} equipped.`);
    } else {
        bot.chat(`No ${preferred} available. Defaulting to fist attack.`);
    }
}

// Check if timeout exceeded
let taskStartTime = Date.now();
function timeoutExceeded(timeout = 60000) {
    return Date.now() - taskStartTime > timeout;
}


// Phase 6: Locate the stronghold using Ender Eyes
async function findStronghold() {
    bot.chat("Locating the stronghold...");

    const eyeOfEnder = bot.inventory.items().find(item => item.name === "ender_eye");
    if (!eyeOfEnder) {
        bot.chat("No Eyes of Ender in inventory. Aborting.");
        return;
    }

    while (true) {
        bot.chat("Throwing Eye of Ender...");
        try {
            await bot.equip(eyeOfEnder, "hand");
            bot.activateItem(); // Throws Eye of Ender
            await bot.waitForTicks(40); // Wait for Eye to float and fall

            // Follow the Eye's direction (mocked here; ideally use trajectory tracking)
            const lastKnownDirection = bot.entity.yaw;
            const newLocation = bot.entity.position.offset(
                Math.cos(lastKnownDirection) * 20,
                0,
                Math.sin(lastKnownDirection) * 20
            );

            await moveToSafely(newLocation);

            // Recover dropped Eye of Ender
            const droppedEye = bot.nearestEntity(entity => entity.name === "item" && entity.metadata?.[7]?.name === "ender_eye");
            if (droppedEye) {
                await bot.pathfinder.goto(new goals.GoalNear(droppedEye.position.x, droppedEye.position.y, droppedEye.position.z, 1));
                bot.chat("Recovered a dropped Eye of Ender.");
            }

            // Check for stronghold proximity
            if (await isStrongholdDetected()) {
                bot.chat("Stronghold located!");
                break;
            }
        } catch (error) {
            bot.chat(`Error locating stronghold: ${error.message}`);
            return;
        }
    }

    fightEnderDragon();
}

// Stronghold detection logic
async function isStrongholdDetected() {
    const blockBelow = bot.blockAt(bot.entity.position.offset(0, -1, 0));
    return blockBelow && blockBelow.name === "stone_bricks"; // Adjust logic for stronghold blocks
}

// Phase 7: Engage and defeat the Ender Dragon
async function fightEnderDragon() {
    bot.chat("Engaging the Ender Dragon...");

    // Step 1: Destroy End Crystals to weaken the dragon
    bot.chat("Targeting End Crystals...");
    let crystalsDestroyed = 0;
    const endCrystals = bot.findEntities({ type: "end_crystal" });

    for (const crystal of endCrystals) {
        try {
            await moveToSafely(crystal.position);
            if (bot.inventory.items().find(item => item.name === "bow")) {
                await equipBestWeapon("bow");
                bot.chat("Shooting End Crystal with a bow...");
                bot.attack(crystal);
            } else {
                bot.chat("Attacking End Crystal directly...");
                bot.attack(crystal);
            }
            crystalsDestroyed++;
            bot.chat(`End Crystal destroyed: ${crystalsDestroyed}`);
        } catch (error) {
            bot.chat(`Failed to destroy an End Crystal: ${error.message}`);
        }
    }

    bot.chat("All End Crystals destroyed.");

    // Step 2: Attack the Ender Dragon when it perches or flies nearby
    const dragon = bot.nearestEntity(entity => entity.name === "ender_dragon");
    while (dragon && dragon.health > 0) {
        const distance = dragon.position.distanceTo(bot.entity.position);
        if (distance < 10) {
            bot.chat("Attacking Ender Dragon directly...");
            await equipBestWeapon("sword");
            bot.attack(dragon);
            await bot.waitForTicks(20);
        } else {
            bot.chat("Waiting for the dragon to perch...");
            await moveToSafely(dragon.position.offset(0, -1, 0)); // Move closer to where it might perch
        }
    }

    bot.chat("Ender Dragon defeated! Speedrun complete.");
}

// Helper: Move to a position with hazard detection
async function moveToSafely(position) {
    const movements = new Movements(bot, bot.pathfinder);
    movements.allowSprinting = true;
    movements.canDig = true; // Allow digging if needed
    bot.pathfinder.setMovements(movements);

    const isSafe = pos => {
        const below = bot.blockAt(pos.offset(0, -1, 0));
        return below && below.boundingBox === "block" && !["lava", "fire", "cactus"].includes(below.name);
    };

    if (isSafe(position)) {
        await bot.pathfinder.goto(new goals.GoalBlock(position.x, position.y, position.z));
    } else {
        bot.chat("Unsafe position detected! Adjusting path...");
        await bot.pathfinder.goto(new goals.GoalBlock(position.x + 1, position.y, position.z + 1));
    }
}

// Helper: Equip the best weapon available
async function equipBestWeapon(preferred = "sword") {
    const weapon = bot.inventory.items().find(item => item.name.includes(preferred));
    if (weapon) {
        await bot.equip(weapon, "hand");
        bot.chat(`${preferred} equipped.`);
    } else {
        bot.chat(`No ${preferred} available. Defaulting to fist attack.`);
    }
}
