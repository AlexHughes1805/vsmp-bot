const {SlashCommandBuilder, MessageFlags, EmbedBuilder} = require("discord.js");
const {inventory} = require('../../models/keys.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('inventory')
		.setDescription('See the items in your inventory'),
	async execute(interaction)
    {
		const interactionGuildMember= await interaction.guild.members.fetch(interaction.user.id);
		const userID = interactionGuildMember.user.id;
        const userInventory = await inventory.findOne({ 'userID': userID});

        if(!userInventory || userInventory.tomes.length === 0)
        {
            await interaction.reply
            ({
                content: 'You have no items in your inventory!',
                flags: MessageFlags.Ephemeral
            });
        }

        else
        {
            const inventoryEmbed = new EmbedBuilder()
            .setTitle("Inventory")


            const tomeList = userInventory.tomes
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((tome, index) => `${index + 1}. ${tome.name} x${tome.quantity}`)
                .join('\n');
            
            inventoryEmbed.setDescription(tomeList);

            await interaction.reply({embeds: [inventoryEmbed]});
        }
        
	},
};