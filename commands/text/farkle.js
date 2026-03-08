const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");

// Game state storage
const activeGames = new Map();

// Farkle scoring rules
const WINNING_SCORE = 10000;
const MIN_SCORE_TO_START = 500;

// Helper function to create game key
function getGameKey(userId, channelId) {
    return `${userId}-${channelId}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('farkle')
        .setDescription('Play Farkle!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('pvp')
                .setDescription('Play against someone')
                .addUserOption(option =>
                    option.setName('opponent')
                        .setDescription('The player you want to challenge')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('target')
                        .setDescription('Target score to win (default: 10000)')
                        .setRequired(false)
                        .setMinValue(500)
                        .setMaxValue(100000)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('bot')
                .setDescription('Play against the bot')
                .addIntegerOption(option =>
                    option.setName('target')
                        .setDescription('Target score to win (default: 10000)')
                        .setRequired(false)
                        .setMinValue(500)
                        .setMaxValue(100000))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'pvp') {
            await startPvPGame(interaction);
        } else if (subcommand === 'bot') {
            await startBotGame(interaction);
        }
    },
    
    // Export for testing command
    activeGames,
    getGameKey
};

async function startPvPGame(interaction) {
    const challenger = interaction.user;
    const opponent = interaction.options.getUser('opponent');
    const targetScore = interaction.options.getInteger('target') || WINNING_SCORE;
    const channelId = interaction.channel.id;

    if (opponent.bot) {
        return await interaction.reply({ content: 'You cannot challenge a bot in PvP mode! Use `/farkle bot` instead.', ephemeral: true });
    }

    if (opponent.id === challenger.id) {
        return await interaction.reply({ content: 'You cannot challenge yourself!', ephemeral: true });
    }

    if (activeGames.has(getGameKey(challenger.id, channelId))) {
        return await interaction.reply({ content: 'You are already in a game in this channel!', ephemeral: true });
    }

    if (activeGames.has(getGameKey(opponent.id, channelId))) {
        return await interaction.reply({ content: 'That player is already in a game in this channel!', ephemeral: true });
    }

    const acceptButton = new ButtonBuilder()
        .setCustomId('accept_farkle')
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success);

    const declineButton = new ButtonBuilder()
        .setCustomId('decline_farkle')
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(acceptButton, declineButton);

    const response = await interaction.reply({
        content: `${opponent}, ${challenger} has challenged you to a game of Farkle! First to ${targetScore} points wins!`,
        components: [row]
    });

    const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000
    });

    collector.on('collect', async i => {
        if (i.user.id !== opponent.id) {
            return await i.reply({ content: 'Only the challenged player can respond!', ephemeral: true });
        }

        if (i.customId === 'accept_farkle') {
            collector.stop('accepted');
            await i.update({ content: `${opponent} accepted the challenge! Game starting...`, components: [] });
            await initializeGame(interaction, challenger, opponent, false, targetScore);
        } else if (i.customId === 'decline_farkle') {
            collector.stop('declined');
            await i.update({ content: `${opponent} declined the challenge.`, components: [] });
        }
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await response.edit({ content: `${opponent} did not respond in time. Challenge cancelled.`, components: [] });
        }
    });
}

async function startBotGame(interaction) {
    const player = interaction.user;
    const targetScore = interaction.options.getInteger('target') || WINNING_SCORE;
    const channelId = interaction.channel.id;

    if (activeGames.has(getGameKey(player.id, channelId))) {
        return await interaction.reply({ content: 'You are already in a game in this channel!', ephemeral: true });
    }

    await interaction.reply(`${player} is playing Farkle against the Bot! First to ${targetScore} points wins!`);
    await initializeGame(interaction, player, { id: 'bot', username: 'Bot' }, true, targetScore);
}

async function initializeGame(interaction, player1, player2, isBot, targetScore = WINNING_SCORE) {
    const channelId = interaction.channel.id;
    const gameState = {
        players: [
            { id: player1.id, name: player1.username, score: 0, onBoard: false },
            { id: player2.id, name: player2.username, score: 0, onBoard: false }
        ],
        currentPlayerIndex: 0,
        turnScore: 0,
        dice: 6,
        rolled: [],
        isBot: isBot,
        channel: interaction.channel,
        channelId: channelId,
        targetScore: targetScore
    };

    activeGames.set(getGameKey(player1.id, channelId), gameState);
    if (!isBot) {
        activeGames.set(getGameKey(player2.id, channelId), gameState);
    }

    await takeTurn(gameState);
}

// Helper function to format current scores
function getScoresDisplay(gameState) {
    return gameState.players.map(p => `${p.name}: **${p.score}**`).join(' | ');
}

async function takeTurn(gameState) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    if (gameState.isBot && currentPlayer.id === 'bot') {
        await botTurn(gameState);
        return;
    }

    const dice = rollDice(gameState.dice);
    gameState.rolled = dice;
    
    const scorableIndices = getScorableDice(dice);

    if (scorableIndices.length === 0) {
        // Farkle!
        gameState.turnScore = 0;
        await gameState.channel.send(`${getScoresDisplay(gameState)}\n${currentPlayer.name} rolled: ${formatDice(dice)}\n\nThere are no melds on the board. Farkle! Ending turn.`);
        await endTurn(gameState);
        return;
    }

    // Show dice with selection options
    await showDiceSelection(gameState, currentPlayer, dice, scorableIndices);
}

// Determine which dice can score (1s and 5s individually, or multiples)
function getScorableDice(dice) {
    const counts = [0, 0, 0, 0, 0, 0, 0]; // index 1-6
    dice.forEach(d => counts[d]++);
    
    // Check for straight (1-2-3-4-5-6) - all dice score
    if (dice.length === 6 && counts.slice(1).every(c => c === 1)) {
        return dice.map((_, idx) => idx);
    }
    
    // Check for three pairs - all dice score
    const pairs = counts.filter(c => c === 2).length;
    if (pairs === 3) {
        return dice.map((_, idx) => idx);
    }
    
    // Check for two triplets - all dice score
    const triplets = counts.filter(c => c === 3).length;
    if (triplets === 2) {
        return dice.map((_, idx) => idx);
    }
    
    // Check for four of a kind with a pair - all dice score
    const fourOfKind = counts.findIndex(c => c === 4);
    if (fourOfKind !== -1 && pairs === 1) {
        return dice.map((_, idx) => idx);
    }
    
    // Mark scorable dice
    const scorable = [];
    
    dice.forEach((d, idx) => {
        // Individual 1s and 5s always score (unless part of a set of 3+)
        if ((d === 1 || d === 5) && counts[d] < 3) {
            scorable.push(idx);
        }
        // Three or more of a kind - all dice of that number score together
        else if (counts[d] >= 3) {
            scorable.push(idx);
        }
    });
    
    return scorable;
}

async function showDiceSelection(gameState, currentPlayer, dice, scorableIndices) {
    const selected = new Array(dice.length).fill(false);
    
    async function updateSelectionMessage() {
        const rows = [];
        
        // Create buttons for each die
        const diceButtons = [];
        for (let i = 0; i < dice.length; i++) {
            const isScoring = scorableIndices.includes(i);
            const diceEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
            const emoji = diceEmojis[dice[i] - 1];
            
            diceButtons.push(
                new ButtonBuilder()
                    .setCustomId(`die_${i}`)
                    .setLabel(selected[i] ? `✓ ${dice[i]}` : `${dice[i]}`)
                    .setEmoji(selected[i] ? '✅' : emoji)
                    .setStyle(selected[i] ? ButtonStyle.Success : (isScoring ? ButtonStyle.Primary : ButtonStyle.Secondary))
                    .setDisabled(!isScoring)
            );
        }
        
        // Split into rows (max 5 buttons per row)
        rows.push(new ActionRowBuilder().addComponents(diceButtons.slice(0, 5)));
        if (diceButtons.length > 5) {
            rows.push(new ActionRowBuilder().addComponents(diceButtons.slice(5)));
        }
        
        // Add confirm button
        const selectedIndices = selected.map((s, i) => s ? i : -1).filter(i => i !== -1);
        const selectionScore = calculateSelectionScore(dice, selectedIndices);
        
        const confirmButton = new ButtonBuilder()
            .setCustomId('confirm_selection')
            .setLabel(selectedIndices.length > 0 ? `Keep Selected (${selectionScore} pts)` : 'Select Dice')
            .setStyle(ButtonStyle.Success)
            .setDisabled(selectedIndices.length === 0);
        
        const forfeitButton = new ButtonBuilder()
            .setCustomId('forfeit_game')
            .setLabel('Forfeit Game')
            .setStyle(ButtonStyle.Danger);
        
        rows.push(new ActionRowBuilder().addComponents(confirmButton, forfeitButton));
        
        const currentScore = gameState.players[gameState.currentPlayerIndex].score;
        const diceDisplay = dice.map((d, i) => {
            const diceEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
            const emoji = diceEmojis[d - 1];
            const mark = selected[i] ? '✅' : (scorableIndices.includes(i) ? '⬜' : '❌');
            return `${emoji}${mark}`;
        }).join(' ');
        
        return {
            content: `${getScoresDisplay(gameState)}\n**${currentPlayer.name}'s Turn**\n` +
                     `Current Total: ${currentScore} | Turn Score: ${gameState.turnScore}\n` +
                     `Rolled (${gameState.dice} dice): ${diceDisplay}\n\n` +
                     `Click dice to select/deselect them:\n` +
                     `✅ = Selected | ⬜ = Can select | ❌ = Cannot score\n` +
                     (selectedIndices.length > 0 ? `\nSelected score: **${selectionScore}** points` : ''),
            components: rows
        };
    }
    
    const message = await gameState.channel.send(await updateSelectionMessage());
    
    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120000
    });
    
    collector.on('collect', async i => {
        if (i.user.id !== currentPlayer.id) {
            return await i.reply({ content: 'It\'s not your turn!', ephemeral: true });
        }
        
        if (i.customId.startsWith('die_')) {
            const index = parseInt(i.customId.split('_')[1]);
            selected[index] = !selected[index];
            await i.update(await updateSelectionMessage());
        } else if (i.customId === 'forfeit_game') {
            collector.stop('forfeited');
            await i.update({ components: [] });
            await forfeitGame(gameState, currentPlayer);
            return;
        } else if (i.customId === 'confirm_selection') {
            const selectedIndices = selected.map((s, i) => s ? i : -1).filter(i => i !== -1);
            
            // Validate the selection
            const validation = validateSelection(dice, selectedIndices, scorableIndices);
            if (!validation.valid) {
                return await i.reply({ content: validation.error, ephemeral: true });
            }
            
            collector.stop('confirmed');
            const selectionScore = calculateSelectionScore(dice, selectedIndices);
            
            await i.update({ components: [] });
            await handleDiceSelection(gameState, currentPlayer, dice.length, selectedIndices.length, selectionScore);
        }
    });
    
    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await message.edit({ content: `${currentPlayer.name} took too long! Turn forfeited.`, components: [] });
            gameState.turnScore = 0;
            await endTurn(gameState);
        }
    });
}

function validateSelection(dice, selectedIndices, scorableIndices) {
    if (selectedIndices.length === 0) {
        return { valid: false, error: 'You must select at least one die!' };
    }
    
    const selectedDice = selectedIndices.map(i => dice[i]);
    const counts = [0, 0, 0, 0, 0, 0, 0];
    dice.forEach(d => counts[d]++);
    
    const selectedCounts = [0, 0, 0, 0, 0, 0, 0];
    selectedDice.forEach(d => selectedCounts[d]++);
    
    // Check for special combinations that require all dice
    const pairs = counts.filter(c => c === 2).length;
    const triplets = counts.filter(c => c === 3).length;
    const fourOfKind = counts.findIndex(c => c === 4);
    
    // Straight - must select all 6
    if (dice.length === 6 && counts.slice(1).every(c => c === 1)) {
        if (selectedIndices.length !== 6) {
            return { valid: false, error: 'For a straight, you must select all 6 dice!' };
        }
        return { valid: true };
    }
    
    // Three pairs - must select all 6
    if (pairs === 3) {
        if (selectedIndices.length !== 6) {
            return { valid: false, error: 'For three pairs, you must select all 6 dice!' };
        }
        return { valid: true };
    }
    
    // Two triplets - must select all 6
    if (triplets === 2) {
        if (selectedIndices.length !== 6) {
            return { valid: false, error: 'For two triplets, you must select all 6 dice!' };
        }
        return { valid: true };
    }
    
    // Four of a kind with a pair - must select all 6
    if (fourOfKind !== -1 && pairs === 1) {
        if (selectedIndices.length !== 6) {
            return { valid: false, error: 'For four of a kind with a pair, you must select all 6 dice!' };
        }
        return { valid: true };
    }
    
    // Validate individual selections
    for (let num = 1; num <= 6; num++) {
        if (selectedCounts[num] > 0) {
            // If it's a set (3+), must select all or none
            if (counts[num] >= 3) {
                if (selectedCounts[num] !== counts[num] && selectedCounts[num] !== 0) {
                    return { valid: false, error: `For three or more ${num}s, you must select all of them together!` };
                }
            }
            // For 1s and 5s, can select individually (if not part of a set)
            else if (num !== 1 && num !== 5) {
                return { valid: false, error: `${num}s only score as part of three or more!` };
            }
        }
    }
    
    return { valid: true };
}

function calculateSelectionScore(dice, selectedIndices) {
    if (selectedIndices.length === 0) return 0;
    
    const selectedDice = selectedIndices.map(i => dice[i]);
    const scoring = calculateScoring(selectedDice);
    return scoring.bestScore;
}

async function handleDiceSelection(gameState, currentPlayer, totalDice, keptDice, score) {
    gameState.turnScore += score;
    gameState.dice = totalDice - keptDice;
    
    // Check for hot dice
    if (gameState.dice === 0) {
        gameState.dice = 6;
        await showHotDiceChoice(gameState, currentPlayer);        return;
    }
    
    // Show roll or bank options
    const rollButton = new ButtonBuilder()
        .setCustomId('action_roll')
        .setLabel(`Roll ${gameState.dice} Dice`)
        .setStyle(ButtonStyle.Primary);
    
    const bankButton = new ButtonBuilder()
        .setCustomId('action_bank')
        .setLabel('Bank Points')
        .setStyle(ButtonStyle.Success);
    
    const forfeitButton = new ButtonBuilder()
        .setCustomId('action_forfeit')
        .setLabel('Forfeit Game')
        .setStyle(ButtonStyle.Danger);
    
    const row = new ActionRowBuilder().addComponents(rollButton, bankButton, forfeitButton);
    
    const currentScore = gameState.players[gameState.currentPlayerIndex].score;
    const totalIfBanked = currentScore + gameState.turnScore;
    
    const message = await gameState.channel.send({
        content: `${getScoresDisplay(gameState)}\n**${currentPlayer.name}** kept dice worth **${score}** points!\n` +
                 `Turn Score: **${gameState.turnScore}** | If you bank: **${totalIfBanked}** points\n` +
                 `${gameState.dice} dice remaining`,
        components: [row]
    });
    
    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120000
    });
    
    collector.on('collect', async i => {
        if (i.user.id !== currentPlayer.id) {
            return await i.reply({ content: 'It\'s not your turn!', ephemeral: true });
        }
        
        if (i.customId === 'action_roll') {
            collector.stop('roll');
            await i.update({ components: [] });
            await takeTurn(gameState);
        } else if (i.customId === 'action_forfeit') {
            collector.stop('forfeited');
            await i.update({ components: [] });
            await forfeitGame(gameState, currentPlayer);
            return;
        } else if (i.customId === 'action_bank') {
            collector.stop('bank');
            await i.update({ components: [] });
            
            // Check if player can get on the board
            if (!currentPlayer.onBoard && gameState.turnScore < MIN_SCORE_TO_START) {
                await gameState.channel.send(`You need at least ${MIN_SCORE_TO_START} points to get on the board! You only have ${gameState.turnScore}. Turn ended.`);
                gameState.turnScore = 0;
                await endTurn(gameState);
                return;
            }
            
            currentPlayer.onBoard = true;
            currentPlayer.score += gameState.turnScore;
            
            await gameState.channel.send(`**${currentPlayer.name}** banked **${gameState.turnScore}** points! Total: **${currentPlayer.score}**`);
            
            if (currentPlayer.score >= gameState.targetScore) {
                await endGame(gameState, currentPlayer);
                return;
            }
            
            gameState.turnScore = 0;
            await endTurn(gameState);
        }
    });
    
    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await message.edit({ content: `${currentPlayer.name} took too long! Turn forfeited.`, components: [] });
            gameState.turnScore = 0;
            await endTurn(gameState);
        }
    });
}

async function showHotDiceChoice(gameState, currentPlayer) {
    const rollButton = new ButtonBuilder()
        .setCustomId('hotdice_roll')
        .setLabel('Roll All 6 Dice')
        .setStyle(ButtonStyle.Primary);

    const bankButton = new ButtonBuilder()
        .setCustomId('hotdice_bank')
        .setLabel('Bank Points')
        .setStyle(ButtonStyle.Success);

    const forfeitButton = new ButtonBuilder()
        .setCustomId('hotdice_forfeit')
        .setLabel('Forfeit Game')
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(rollButton, bankButton, forfeitButton);

    const currentScore = gameState.players[gameState.currentPlayerIndex].score;
    const totalIfBanked = currentScore + gameState.turnScore;

    const message = await gameState.channel.send({
        content: `${getScoresDisplay(gameState)}\n**${currentPlayer.name}'s Turn**\n` +
                 `Hot Dice! All six dice have scored: you can throw all of them again or bank!\n\n` +
                 `Turn Score: ${gameState.turnScore}\n` +
                 `If you bank: **${totalIfBanked}** points`,
        components: [row]
    });

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120000
    });

    collector.on('collect', async i => {
        if (i.user.id !== currentPlayer.id) {
            return await i.reply({ content: 'It\'s not your turn!', ephemeral: true });
        }

        if (i.customId === 'hotdice_roll') {
            collector.stop('roll');
            await i.update({ components: [] });
            await takeTurn(gameState);
        } else if (i.customId === 'hotdice_forfeit') {
            collector.stop('forfeited');
            await i.update({ components: [] });
            await forfeitGame(gameState, currentPlayer);
            return;
        } else if (i.customId === 'hotdice_bank') {
            collector.stop('bank');
            await i.update({ components: [] });
            
            // Check if player can get on the board
            if (!currentPlayer.onBoard && gameState.turnScore < MIN_SCORE_TO_START) {
                await gameState.channel.send(`You need at least ${MIN_SCORE_TO_START} points to get on the board! You only have ${gameState.turnScore}. Turn ended.`);
                gameState.turnScore = 0;
                await endTurn(gameState);
                return;
            }
            
            currentPlayer.onBoard = true;
            currentPlayer.score += gameState.turnScore;
            
            await gameState.channel.send(`**${currentPlayer.name}** banked **${gameState.turnScore}** points! Total: **${currentPlayer.score}**`);
            
            if (currentPlayer.score >= gameState.targetScore) {
                await endGame(gameState, currentPlayer);
                return;
            }
            
            gameState.turnScore = 0;
            await endTurn(gameState);
        }
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            await message.edit({ content: `${currentPlayer.name} took too long! Turn forfeited.`, components: [] });
            gameState.turnScore = 0;
            await endTurn(gameState);
        }
    });
}

async function botTurn(gameState) {
    const bot = gameState.players[gameState.currentPlayerIndex];
    let continueTurn = true;
    
    await gameState.channel.send(`${getScoresDisplay(gameState)}\n**Bot's Turn**`);
    
    while (continueTurn) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Delay for realism
        
        const dice = rollDice(gameState.dice);
        gameState.rolled = dice;
        
        const scoring = calculateScoring(dice);
        const hasScoringDice = scoring.combinations.length > 0;

        const diceDisplay = formatDice(dice);
        
        if (!hasScoringDice) {
            // Bot farkled
            gameState.turnScore = 0;
            await gameState.channel.send(`${getScoresDisplay(gameState)}\nBot rolled: ${diceDisplay}\n\nThere are no melds on the board. Farkle! Ending turn.`);
            await endTurn(gameState);
            return;
        }

        await gameState.channel.send(`Bot rolled (${gameState.dice} dice): ${diceDisplay}\n${formatScoringInfo(scoring)}`);
        
        gameState.turnScore += scoring.bestScore;
        gameState.dice = scoring.diceRemaining;
        
        // Hot dice
        if (gameState.dice === 0) {
            gameState.dice = 6;
            await gameState.channel.send(`Hot dice! All six dice have scored: bot rolling all 6 dice again!`);
        }
        
        // Bot decision logic: bank if score is good enough or risk is too high
        const shouldBank = botDecision(gameState, bot);
        
        if (shouldBank) {
            // Check if bot can get on board
            if (!bot.onBoard && gameState.turnScore < MIN_SCORE_TO_START) {
                await gameState.channel.send(`Bot needs at least ${MIN_SCORE_TO_START} points to get on the board! Only has ${gameState.turnScore}. Turn ended.`);
                gameState.turnScore = 0;
                await endTurn(gameState);
                return;
            }
            
            bot.onBoard = true;
            bot.score += gameState.turnScore;
            await gameState.channel.send(`**Bot** banked **${gameState.turnScore}** points! Total: **${bot.score}**`);
            
            if (bot.score >= gameState.targetScore) {
                await endGame(gameState, bot);
                return;
            }
            
            gameState.turnScore = 0;
            await endTurn(gameState);
            return;
        }
    }
}

function botDecision(gameState, bot) {
    const currentTotal = bot.score + gameState.turnScore;
    const opponent = gameState.players[gameState.currentPlayerIndex === 0 ? 1 : 0];
    
    // Bank if not on board and has enough points
    if (!bot.onBoard && gameState.turnScore >= MIN_SCORE_TO_START) {
        return Math.random() < 0.7; // 70% chance to bank when first getting on board
    }
    
    // Bank if turn score is high
    if (gameState.turnScore >= 1500) return true;
    
    // Bank if close to winning
    if (currentTotal >= gameState.targetScore) return true;
    
    // Bank if opponent is close to winning and bot has good points
    if (opponent.score >= gameState.targetScore - 2000 && gameState.turnScore >= 800) return true;
    
    // Risk assessment based on remaining dice
    if (gameState.dice === 1) return Math.random() < 0.8; // 80% bank with 1 die
    if (gameState.dice === 2) return Math.random() < 0.6; // 60% bank with 2 dice
    if (gameState.turnScore >= 1000) return Math.random() < 0.5; // 50% bank with 1000+ points
    
    return false; // Keep rolling
}

async function endTurn(gameState) {
    gameState.currentPlayerIndex = (gameState.currentPlayerIndex + 1) % 2;
    gameState.dice = 6;
    gameState.turnScore = 0;
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    await takeTurn(gameState);
}

async function endGame(gameState, winner) {
    const loser = gameState.players.find(p => p.id !== winner.id);
    
    await gameState.channel.send(`**GAME OVER!**\n` +
                                 `**${winner.name}** wins with **${winner.score}** points!\n` +
                                 `${loser.name} finished with **${loser.score}** points.`);
    
    // Clean up
    gameState.players.forEach(p => activeGames.delete(getGameKey(p.id, gameState.channelId)));
}

async function forfeitGame(gameState, player) {
    const opponent = gameState.players.find(p => p.id !== player.id);
    
    await gameState.channel.send(`**${player.name}** has forfeited the game!\n` +
                                 `**${opponent.name}** wins by forfeit!`);
    
    // Clean up
    gameState.players.forEach(p => activeGames.delete(getGameKey(p.id, gameState.channelId)));
}

function rollDice(count) {
    const dice = [];
    for (let i = 0; i < count; i++) {
        dice.push(Math.floor(Math.random() * 6) + 1);
    }
    return dice.sort((a, b) => a - b);
}

function formatDice(dice) {
    const diceEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
    return dice.map(d => diceEmojis[d - 1]).join(' ');
}

function calculateScoring(dice) {
    const counts = [0, 0, 0, 0, 0, 0, 0]; // index 1-6
    dice.forEach(d => counts[d]++);
    
    const combinations = [];
    let bestScore = 0;
    let diceUsed = 0;
    
    // Check for straight (1-2-3-4-5-6)
    if (dice.length === 6 && counts.slice(1).every(c => c === 1)) {
        combinations.push({ desc: 'Straight (1-2-3-4-5-6)', points: 1500, dice: 6 });
        return { combinations, bestScore: 1500, diceRemaining: 0 };
    }
    
    // Check for three pairs
    const pairs = counts.filter(c => c === 2).length;
    if (pairs === 3) {
        combinations.push({ desc: 'Three Pairs', points: 1500, dice: 6 });
        return { combinations, bestScore: 1500, diceRemaining: 0 };
    }
    
    // Check for two triplets
    const triplets = counts.filter(c => c === 3).length;
    if (triplets === 2) {
        combinations.push({ desc: 'Two Triplets', points: 2500, dice: 6 });
        return { combinations, bestScore: 2500, diceRemaining: 0 };
    }
    
    // Check for four of a kind with a pair
    const fourOfKindNum = counts.findIndex(c => c === 4);
    if (fourOfKindNum !== -1 && pairs === 1) {
        combinations.push({ desc: 'Four of a Kind with a Pair', points: 1500, dice: 6 });
        return { combinations, bestScore: 1500, diceRemaining: 0 };
    }
    
    // Check for 6 of a kind, 5 of a kind, 4 of a kind, 3 of a kind
    for (let num = 1; num <= 6; num++) {
        if (counts[num] === 6) {
            combinations.push({ desc: `Six ${num}s`, points: 3000, dice: 6 });
            bestScore += 3000;
            diceUsed += 6;
        } else if (counts[num] === 5) {
            combinations.push({ desc: `Five ${num}s`, points: 2000, dice: 5 });
            bestScore += 2000;
            diceUsed += 5;
        } else if (counts[num] === 4) {
            combinations.push({ desc: `Four ${num}s`, points: 1000, dice: 4 });
            bestScore += 1000;
            diceUsed += 4;
        } else if (counts[num] === 3) {
            const baseScore = num === 1 ? 300 : num * 100;
            combinations.push({ desc: `Three ${num}s`, points: baseScore, dice: 3 });
            bestScore += baseScore;
            diceUsed += 3;
        }
    }
    
    // Single 1s and 5s (only if not part of a set)
    const ones = counts[1] < 3 ? counts[1] : 0;
    const fives = counts[5] < 3 ? counts[5] : 0;
    
    if (ones > 0) {
        combinations.push({ desc: `${ones} One${ones > 1 ? 's' : ''}`, points: ones * 100, dice: ones });
        bestScore += ones * 100;
        diceUsed += ones;
    }
    
    if (fives > 0) {
        combinations.push({ desc: `${fives} Five${fives > 1 ? 's' : ''}`, points: fives * 50, dice: fives });
        bestScore += fives * 50;
        diceUsed += fives;
    }
    
    return {
        combinations,
        bestScore,
        diceRemaining: dice.length - diceUsed
    };
}

function formatScoringInfo(scoring) {
    if (scoring.combinations.length === 0) {
        return 'No scoring combinations!';
    }
    
    const combos = scoring.combinations.map(c => `• ${c.desc}: **${c.points}** points`).join('\n');
    return `**Scoring:**\n${combos}\n**Total this roll: ${scoring.bestScore}** points`;
}
