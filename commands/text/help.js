const {SlashCommandBuilder} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Shows available commands and their descriptions'),
	async execute(interaction)
    {
		await interaction.reply("**\/tomb** - Enter a tomb by yourself or with others. Tag others to have them join you. \n**\/inspectchest** - Open a chest in a tomb for an item. Can only be used if \/tomb was used first. \n**\/exit** - Leave a tomb by yourself or with others. Tag others to have them join you. \n**\/inventory** - Lists items you have collected. \n**\/give **- Give an item to another person. Tag them to give them the item. \n**\/consume **- Consumes an item in your inventory. \n**/profile** - Lists items that have been consumed.");
    },
};