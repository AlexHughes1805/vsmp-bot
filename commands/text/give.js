const {SlashCommandBuilder, MessageFlags, EmbedBuilder} = require("discord.js");
const {inventory} = require('../../models/keys.js');

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
                const userInventory = await inventory.findOne({ 'userID': userID});
                
                if(!userInventory || userInventory.tomes.length === 0) {
                    await interaction.respond([]);
                    return;
                }
                
                const filtered = userInventory.tomes
                    .filter(tome => tome.name.toLowerCase().includes(focusedValue))
                    .slice(0, 25)
                    .map(tome => ({
                        name: `${tome.name} (x${tome.quantity})`,
                        value: tome.name
                    }));
                
                await interaction.respond(filtered.length > 0 ? filtered : userInventory.tomes.slice(0, 25).map(tome => ({ name: `${tome.name} (x${tome.quantity})`, value: tome.name })));
                
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
            const senderInventory = await inventory.findOne({ 'userID': userID});
            
            if (!senderInventory || senderInventory.tomes.length === 0) {
                return await interaction.reply({
                    content: 'You don\'t have any items in your inventory!',
                    flags: MessageFlags.Ephemeral
                });
            }
            
            // Find the specific item
            const itemDoc = senderInventory.tomes.find(t => t.name === itemName);
            
            if (!itemDoc) {
                return await interaction.reply({
                    content: `You don't have a "${itemName}" in your inventory!`,
                    flags: MessageFlags.Ephemeral
                });
            }
            
            // Decrease quantity or remove item from sender's inventory
            if (itemDoc.quantity > 1) {
                itemDoc.quantity -= 1;
            } else {
                senderInventory.tomes = senderInventory.tomes.filter(t => t.name !== itemName);
            }
            await senderInventory.save();
            
            // Find or create recipient's inventory
            let recipientInventory = await inventory.findOne({ 'userID': recipient.id });
            
            if (!recipientInventory) {
                // Create new inventory for recipient
                recipientInventory = await inventory.create({
                    userID: recipient.id,
                    tomes: [{ name: itemName, quantity: 1 }]
                });
            } else {
                // Check if recipient already has this item
                const existingItem = recipientInventory.tomes.find(t => t.name === itemName);
                
                if (existingItem) {
                    // Increment quantity if item exists
                    existingItem.quantity += 1;
                } else {
                    // Add new item if it doesn't exist
                    recipientInventory.tomes.push({ name: itemName, quantity: 1 });
                }
                await recipientInventory.save();
            }
            
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