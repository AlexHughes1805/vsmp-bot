const {SlashCommandBuilder, MessageFlags} = require("discord.js");
const {profile, inventory} = require('../../models/keys.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forcecure')
        .setDescription('hoc-vinculum-tibi-diru-mpo-mala-creatura')
        .addUserOption((option) => option.setName('target').setDescription('The vampire to cure').setRequired(true)),

    async execute(interaction) {
        const interactionGuildMember = await interaction.guild.members.fetch(interaction.user.id);
        const userID = interactionGuildMember.user.id;
        const userRoles = interactionGuildMember.roles.cache;
        
        const targetUser = interaction.options.getUser('target');
        const targetMember = targetUser ? await interaction.guild.members.fetch(targetUser.id) : null;

        try {
            // Check if user is trying to target themselves
            if (targetUser.id === userID) {
                return await interaction.reply({
                    content: 'You cannot force cure yourself. Use the self-cure command instead.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Check that target is a vampire
            const targetRoles = targetMember.roles.cache;
            
            if (!targetRoles.some(role => role.name === 't!vampire')) {
                return await interaction.reply({
                    content: `${targetUser.username} is not a vampire. There is no curse to break.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Check if user has read all four required cure books
            const userProfile = await profile.findOne({ 'userID': userID });
            
            const requiredTomes = [
                'Cure Book: The Remedy',
                'Cure Book: The Cure',
                'Cure Book: The Absolution',
                'Cure Book: The Retribution'
            ];

            if (!userProfile || !requiredTomes.every(tome => userProfile.consumedTomes.includes(tome))) {
                return await interaction.reply({
                    content: 'You do not possess the knowledge required to force cure another.',
                    flags: MessageFlags.Ephemeral
                });
            }

            // Check if user has holy water in inventory
            const userInventory = await inventory.findOne({ 'userID': userID });
            
            if (!userInventory || !userInventory.tomes.some(tome => tome.name === 'Holy Water')) {
                return await interaction.reply({
                    content: `You must have Holy Water.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Determine who is being cured
            const targetToCure = targetMember;
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
            await interaction.reply(`${targetUser.username} has been forcibly cured of vampirism.`);

        } catch (error) {
            console.error('Error in force cure command:', error);
            
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
