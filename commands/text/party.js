const {SlashCommandBuilder, MessageFlags} = require("discord.js");
const {tombs} = require('../../models/keys.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('party')
        .setDescription('View your current adventurying party'),
    async execute(interaction)
    {
        const threadID = interaction.channel.id;
        const interactionGuildMember = await interaction.guild.members.fetch(interaction.user.id);
        const userID = interactionGuildMember.user.id;
        
        const itemDoc = await tombs.findOne({ 
            threadID: threadID
        });

        if (!itemDoc) {
            return await interaction.reply({
                content: 'You are not in a tomb.',
                flags: MessageFlags. Ephemeral
            });
        }

        if (!itemDoc.members.includes(userID)) {
            return await interaction.reply({
                content: 'You are not in a tomb.',
                flags: MessageFlags. Ephemeral
            });
        }

        // Build list of party members
        const memberList = itemDoc.members.map((id, index) => {
            return `${index +1}. <${id}>`;
        });

        await interaction.reply(`**Your current party:**\n${memberList.join('\n')}`);
    },
};