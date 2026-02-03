const {SlashCommandBuilder, MessageFlags, EmbedBuilder} = require("discord.js");
const {profile} = require('../../models/keys.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('See what tomes you have consumed'),
    async execute(interaction)
    {
        const interactionGuildMember= await interaction.guild.members.fetch(interaction.user.id);
        const userID = interactionGuildMember.user.id;
        const userProfile = await profile.findOne({ 'userID': userID});

        if(!userProfile || userProfile.consumedTomes.length === 0)
        {
            await interaction.reply
            ({
                content: 'You haven\'t consumed any tomes',
                flags: MessageFlags.Ephemeral
            });
        }

        else
        {
            const profileEmbed = new EmbedBuilder()
            .setTitle("Items you have consumed")


            const tomeList = userProfile.consumedTomes
                .sort((a, b) => a.localeCompare(b))
                .map((tome, index) => `${index + 1}. ${tome}`)
                .join('\n');
            
            profileEmbed.setDescription(tomeList);

            await interaction.reply({embeds: [profileEmbed]});
        }
        
    },
};