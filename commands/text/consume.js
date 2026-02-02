const {SlashCommandBuilder, MessageFlags, EmbedBuilder} = require("discord.js");
const {inventory, profile} = require('../../models/keys.js');

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
        const interactionGuildMember = await interaction.guild.members.fetch(interaction.user.id);
        const userID = interactionGuildMember.user.id;
        const userRoles = interactionGuildMember.roles.cache;

        try {
            // Find user's inventory
            const userInventory = await inventory.findOne({ 'userID': userID});
            
            if (!userInventory || userInventory.tomes.length === 0) {
                return await interaction.reply({
                    content: 'You don\'t have any items in your inventory!',
                    flags: MessageFlags.Ephemeral
                });
            }
            
            // Find the specific item
            const itemDoc = userInventory.tomes.find(t => t.name === itemName);
            
            if (!itemDoc) {
                return await interaction.reply({
                    content: `You don't have a "${itemName}" in your inventory!`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Can't read cure books with this command
            if (itemName.startsWith('Cure Book:')) {
                return await interaction.reply({
                    content: 'Cure books cannot be consumed with this command (the code is long enough). Use `/readcure` instead.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Check if already consumed
            let userProfile = await profile.findOne({ 'userID': userID });
            const alreadyConsumed = userProfile && userProfile.consumedTomes.includes(itemName);

            if (userRoles.some(role => role.name === 't!vampire')) // vampires can't consume tomes lol
            {
                await interaction.reply("```You hold the tome in your hands, awaiting its knowledge. You wait and you wait, but nothing happens. You have failed to consume its powers.```")
            }
            else if (userRoles.some(role => role.name === 't!human'))
            {
                // Add to consumed tomes if not already consumed
                if (!userProfile) {
                    userProfile = await profile.create({
                        'userID': userID,
                        'consumedTomes': [itemName]
                    });
                } else if (!alreadyConsumed) {
                    userProfile.consumedTomes.push(itemName);
                    await userProfile.save();
                }

                // Decrease quantity or remove item from inventory
                if (itemDoc.quantity > 1) {
                    itemDoc.quantity -= 1;
                    await userInventory.save();
                } else {
                    userInventory.tomes = userInventory.tomes.filter(t => t.name !== itemName);
                    await userInventory.save();
                }
            
                await interaction.reply(`\`\`\`\nAll of a sudden, the knowledge of the holy text floods into you - a swift transfer of energy surging within you. You know now are able to use this power however you wish, and the iridescence from the book temporarily transfers onto your fingertips, radiating the same familiar glow. Welcome to your new power.\`\`\`\n\`\`\`${itemName} has been consumed and has left your inventory.\`\`\``);
            }

        } catch (error) {
            console.error('Error in give command:', error);
            await interaction.reply({
                content: 'An error occurred while consuming the item.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};