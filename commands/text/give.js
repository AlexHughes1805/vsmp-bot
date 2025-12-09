const {SlashCommandBuilder, MessageFlags, EmbedBuilder} = require("discord.js");
const {tomes} = require('../../models/keys.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('give')
        .setDescription('Give an item from your inventory to another person')
        .addUserOption((option) => option.setName('user').setDescription(`Who you're giving the item to`).setRequired(true))
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
        const recipient = interaction.options.getUser('user');
        const interactionGuildMember = await interaction.guild.members.fetch(interaction.user.id);
        const userID = interactionGuildMember.user.id;
        
        // Prevent giving to yourself
        if (recipient.id === userID) {
            return await interaction.reply({
                content: 'You cannot give items to yourself!',
                flags: MessageFlags.Ephemeral
            });
        }
        
        // Prevent giving to bots
        if (recipient.bot) {
            return await interaction.reply({
                content: 'You cannot give items to bots!',
                flags: MessageFlags.Ephemeral
            });
        }
        
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
            
            // Add item to recipient's inventory
            await tomes.create({
                'userID': recipient.id,
                'tome': itemName
            });
            
            // Send confirmation
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('Item Transferred')
                .setDescription(`You gave **${itemName}** to ${recipient.tag}`);
            
            await interaction.reply({
                embeds: [embed],
            });
            
        } catch (error) {
            console.error('Error in give command:', error);
            await interaction.reply({
                content: 'An error occurred while transferring the item.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};