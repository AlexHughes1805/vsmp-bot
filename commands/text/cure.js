const {SlashCommandBuilder, MessageFlags} = require("discord.js");
const {profile, inventory} = require('../../models/keys.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cure')
        .setDescription('voluntate-mea-hoc-nefandum-vinculum-abici')
        .addUserOption((option) => option.setName('target').setDescription('The vampire to cure (leave empty to cure yourself)').setRequired(false)),

    async execute(interaction) {
        const interactionGuildMember = await interaction.guild.members.fetch(interaction.user.id);
        const userID = interactionGuildMember.user.id;
        const userRoles = interactionGuildMember.roles.cache;
        
        const targetUser = interaction.options.getUser('target');
        const targetMember = targetUser ? await interaction.guild.members.fetch(targetUser.id) : null;

        try {
            // If no target specified, user must be a vampire (curing themselves)
            if (!targetUser) {
                // Check if user is a human - can't cure what isn't cursed
                if (userRoles.some(role => role.name === 't!human')) {
                    return await interaction.reply({
                        content: 'You are already human. There is no curse to break.',
                        flags: MessageFlags.Ephemeral
                    });
                }

                // Check if user is a vampire
                if (!userRoles.some(role => role.name === 't!vampire')) {
                    return await interaction.reply({
                        content: 'You must be a vampire to use this command.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } else {
                // If target specified, check that target is a vampire
                const targetRoles = targetMember.roles.cache;
                
                if (!targetRoles.some(role => role.name === 't!vampire')) {
                    return await interaction.reply({
                        content: `${targetUser.username} is not a vampire. There is no curse to break.`,
                        flags: MessageFlags.Ephemeral
                    });
                }
            }

            // Check if user has read the required cure books
            const userProfile = await profile.findOne({ 'userID': userID });
            
            const requiredTomes = [
                'Cure Book: The Remedy',
                'Cure Book: The Cure',
                'Cure Book: The Absolution'
            ];

            if (!userProfile || !requiredTomes.every(tome => userProfile.consumedTomes.includes(tome))) {
                return await interaction.reply({
                    content: 'You do not possess the knowledge required to perform a cure.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Check if user has holy water in inventory
            const userInventory = await inventory.findOne({ 'userID': userID });
            
            if (!userInventory || !userInventory.tomes.some(tome => tome.name === 'Holy Water')) {
                const holyWaterMessage = targetUser
                    ? `You must have Holy Water in your possession to cure ${targetUser.username}.`
                    : 'You must have Holy Water in your possession to cure yourself.';
                
                return await interaction.reply({
                    content: holyWaterMessage,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Determine who is being cured
            const targetToCure = targetMember || interactionGuildMember;
            const vampireRole = interaction.guild.roles.cache.find(role => role.name === 't!vampire');
            const humanRole = interaction.guild.roles.cache.find(role => role.name === 't!human');

            if (!vampireRole || !humanRole) {
                return await interaction.reply({
                    content: 'Could not find the required roles in this server.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Consume the holy water
            const holyWaterItem = userInventory.tomes.find(tome => tome.name === 'Holy Water');
            if (holyWaterItem.quantity > 1) {
                holyWaterItem.quantity -= 1;
                await userInventory.save();
            } else {
                userInventory.tomes = userInventory.tomes.filter(tome => tome.name !== 'Holy Water');
                await userInventory.save();
            }

            // Remove vampire role and add human role
            await targetToCure.roles.remove(vampireRole);
            await targetToCure.roles.add(humanRole);

            // Success message
            const successMessage = targetUser
                ? `${targetUser.username} has been cured of vampirism.`
                : `You have been cured of vampirism.`;

            await interaction.reply(successMessage);

        } catch (error) {
            console.error('Error in cure command:', error);
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'An error occurred while attempting the cure.',
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({
                    content: 'An error occurred while attempting the cure.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};
