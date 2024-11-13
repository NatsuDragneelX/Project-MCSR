const mineflayer = require("mineflayer");
const { goals } = require('mineflayer-pathfinder');
const { pathfinder, Movements } = require('mineflayer-pathfinder');

const bot = mineflayer.createBot({
    username: "SpeedRunnerBot",
    host: "localhost",
    port: 25565, // Make sure this matches your server port
});

bot.loadPlugin(pathfinder);

bot.once("spawn", () => {
    console.log("Bot has spawned and is ready to start the speedrun!");
    bot.chat("Speedrun initiated!");
    gatherWood();
});

async function gatherWood() {
    const tree = bot.findBlock({
        matching: block => block.name.includes("log"),
        maxDistance: 16,
    });

    if (tree) {
        await bot.pathfinder.goto(new goals.GoalBlock(tree.position.x, tree.position.y, tree.position.z));
        await bot.dig(tree);
        bot.chat("Wood gathered!");
        craftWoodenTools();
    } else {
        bot.chat("No trees nearby!");
    }
}

async function craftWoodenTools() {
    const workbench = bot.findBlock({ matching: block => block.name === "crafting_table", maxDistance: 16 });
    
    if (!workbench) {
        await bot.chat("No crafting table nearby. Crafting one...");
        await bot.craft(bot.recipesFor('crafting_table')[0], 1, null);
    }

    const plankRecipe = bot.recipesFor('planks')[0];
    await bot.craft(plankRecipe, 4, null);
    const stickRecipe = bot.recipesFor('stick')[0];
    await bot.craft(stickRecipe, 4, null);

    const pickaxeRecipe = bot.recipesFor('wooden_pickaxe')[0];
    await bot.craft(pickaxeRecipe, 1, null);
    bot.chat("Wooden pickaxe crafted!");

    gatherStone();
}

async function gatherStone() {
    const stone = bot.findBlock({
        matching: block => block.name.includes("stone"),
        maxDistance: 16,
    });

    if (stone) {
        await bot.pathfinder.goto(new goals.GoalBlock(stone.position.x, stone.position.y, stone.position.z));
        await bot.dig(stone);
        bot.chat("Stone gathered!");
        craftStoneTools();
    } else {
        bot.chat("No stone nearby!");
    }
}

async function craftStoneTools() {
    const pickaxeRecipe = bot.recipesFor('stone_pickaxe')[0];
    if (pickaxeRecipe) {
        await bot.craft(pickaxeRecipe, 1, null);
        bot.chat("Stone pickaxe crafted!");
        seekIron();
    } else {
        bot.chat("Unable to craft stone pickaxe.");
    }
}

async function seekIron() {
    const ironOre = bot.findBlock({
        matching: block => block.name === "iron_ore",
        maxDistance: 32,
    });

    if (ironOre) {
        await bot.pathfinder.goto(new goals.GoalBlock(ironOre.position.x, ironOre.position.y, ironOre.position.z));
        await bot.dig(ironOre);
        bot.chat("Iron gathered!");
        smeltIron();
    } else {
        bot.chat("No iron nearby!");
    }
}

async function smeltIron() {
    const furnace = bot.findBlock({ matching: block => block.name === "furnace", maxDistance: 16 });
    
    if (!furnace) {
        bot.chat("No furnace nearby. Crafting one...");
        await bot.craft(bot.recipesFor('furnace')[0], 1, null);
    }
    
    // Place furnace and smelt iron here
    bot.chat("Smelting iron...");
    // Additional code needed to add fuel and iron ore to furnace
    // Continue speedrun process...
}

bot.on("chat", (username, message) => {
    if (username === bot.username) return;
    switch (message) {
        case "start":
            gatherWood();
            break;
        case "stop":
            bot.quit();
            break;
        default:
            bot.chat("Command not recognized.");
    }
});
