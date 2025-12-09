const {SlashCommandBuilder, MessageFlags, EmbedBuilder} = require("discord.js");
const {tomes} = require('../../models/keys.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('inventory')
		.setDescription('See the items in your inventory'),
	async execute(interaction)
    {
		const interactionGuildMember= await interaction.guild.members.fetch(interaction.user.id);
		const userID = interactionGuildMember.user.id;
        const id = await tomes.find({ 'userID': userID});

        if(id.length === 0)
        {
            await interaction.reply
            ({
                content: 'You have no items in your inventory!',
                flags: MessageFlags.Ephemeral
            });
        }

        else
        {
            const inventory = new EmbedBuilder()
            .setTitle("Inventory")


            const tomeList = id
                .map((tome, index) => `${index + 1}. ${tome.tome}`)
                . join('\n');
            
            inventory.setDescription(tomeList);

            await interaction.reply({embeds: [inventory]});
        }
        
	},
};