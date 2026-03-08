const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearfarkle')
        .setDescription('[TEMP] Clear your Farkle game state for testing'),
    
    async execute(interaction) {
        // Import farkle module to access activeGames
        const farkleModule = require('./farkle.js');
        const activeGames = farkleModule.activeGames;
        const getGameKey = farkleModule.getGameKey;
        
        const userId = interaction.user.id;
        const channelId = interaction.channel.id;
        const gameKey = getGameKey(userId, channelId);
        
        if (activeGames.has(gameKey)) {
            const gameState = activeGames.get(gameKey);
            // Clean up all players in this game
            if (gameState && gameState.players) {
                gameState.players.forEach(p => {
                    const key = getGameKey(p.id, channelId);
                    activeGames.delete(key);
                });
            } else {
                // Fallback: just delete this key
                activeGames.delete(gameKey);
            }
            
            await interaction.reply({ 
                content: '✅ Your Farkle game state has been cleared!', 
                ephemeral: true 
            });
        } else {
            await interaction.reply({ 
                content: 'You don\'t have an active Farkle game in this channel.', 
                ephemeral: true 
            });
        }
    },
};
