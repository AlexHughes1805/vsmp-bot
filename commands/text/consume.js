const {SlashCommandBuilder, MessageFlags, EmbedBuilder} = require("discord.js");
const {tomes} = require('../../models/keys.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('consume')
        .setDescription('Consume an item')
        .addStringOption((option) => option.setName('item').setDescription(`The item you're giving`).setRequired(true).setAutocomplete(true)),

    async autocomplete(interaction) {
         const focusedValue = interaction.options.getFocused().toLowerCase();
        const focusedOption = interaction.options.getFocused(true);
        
        // If autocompleting the item field
        if (focusedOption.name === 'item') {
            try {
                const userID = interaction.user.id;
                const userTomes = await tomes.find({ 'userID': userID});
                
                if(!userTomes || userTomes.length === 0) {
                    await interaction.respond([]);
                    return;
                }
                
                const filtered = userTomes
                    .filter(tome => tome.tome.toLowerCase().includes(focusedValue))
                    .slice(0, 25)
                    .map(tome => ({
                        name: tome.tome,
                        value: tome.tome
                    }));
                
                await interaction.respond(filtered.length > 0 ? filtered : userTomes.slice(0, 25).map(tome => ({ name: tome.tome, value: tome.tome })));
                
            } catch (error) {
                console.error('Error in autocomplete:', error);
                await interaction.respond([]);
            }
        }
    },

    async execute(interaction) {
      const itemName = interaction.options.getString('item');
        const interactionGuildMember = await interaction.guild.members.fetch(interaction.user.id);
        const userID = interactionGuildMember.user.id;

        try {
            // Find sender's inventory
            const senderInventory = await tomes.find({ 'userID': userID});
            
            if (!senderInventory || senderInventory.length === 0) {
                return await interaction.reply({
                    content: 'You don\'t have any items in your inventory!',
                    flags: MessageFlags.Ephemeral
                });
            }
            
            // Find the specific item document
            const itemDoc = await tomes.findOne({ 
                'userID': userID,
                'tome': itemName
            });
            
            if (!itemDoc) {
                return await interaction.reply({
                    content: `You don't have a "${itemName}" in your inventory!`,
                    flags: MessageFlags.Ephemeral
                });
            }
            
            // Remove item from sender's inventory
            await tomes.findByIdAndDelete(itemDoc._id);
            
            // Send confirmation
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Item Transferred')
                .setDescription(`You have consumed **${itemName}** `);
            
            await interaction.reply({
                embeds: [embed],
            });
            
        } catch (error) {
            console.error('Error in give command:', error);
            await interaction.reply({
                content: 'An error occurred while consuming the item.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};