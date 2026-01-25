const {SlashCommandBuilder} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Shows available commands and their descriptions'),
	async execute(interaction)
    {
		const helpText = "**\/tomb** - Enter a tomb by yourself or with others. Tag others to have them join you.\n" +
			"**\/join** - Join a preexisting party in a tomb. Tag the a user of the party you want to join and other users you want to join with you.\n" +
			"**\/inspectchest** - Open a chest in a tomb for an item. Can only be used if you have been tagged in or used \/tomb.\n" +
			"**\/party** - View the members of your adventuring party. Can only be used if you have been tagged in or used \/tomb.\n" +
			"**\/exit** - Leave a tomb by yourself or with others. Tag others to have them join you.\n" +
			"**\/inventory** - Lists items you have collected.\n" +
			"**\/give** - Give an item to another person. Tag them to give them the item.\n" +
			"**\/consume** - Consumes an item in your inventory.\n" +
			"**\/profile** - Lists items that have been consumed.\n" +
			"**\/bloodlust** - Rolls a bloodlust check. To be used by vampires to see if they give into their urges.\n" +
			"**\/sessionstart** - Starts the Minecraft session. Also starts the server if it's not active.\n" +
			"**\/sessionend** - Ends the Minecraft session."
			"Check out the bot's status: [here](https://discord.com/channels/1443304941711261696/1445189386416423014/1450902619257045004)\n" +
			"Link to the documentation: [here](https://docs.google.com/document/d/1tmNFFXo34ELh7KZDmYiPH_q7yvZLxRJrUYqQunyRrMM/edit?usp=sharing)";

		await interaction.reply(helpText);
    },
};