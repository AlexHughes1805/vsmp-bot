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
        const id = await profile.find({ 'userID': userID});

        if(id.length === 0)
        {
            await interaction.reply
            ({
                content: 'You haven\'t consumed any tomes',
                flags: MessageFlags.Ephemeral
            });
        }

        else
        {
            const inventory = new EmbedBuilder()
            .setTitle("Items you have consumed")


            const tomeList = id
                .map((tome, index) => `${index + 1}. ${tome.tome}`)
                . join('\n');
            
            inventory.setDescription(tomeList);

            await interaction.reply({embeds: [inventory]});
        }
        
    },
};