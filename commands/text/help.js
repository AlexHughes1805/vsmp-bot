const {SlashCommandBuilder} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Shows available commands and their descriptions'),
	async execute(interaction)
    {
		const helpText = "## Text RP Commands\n" +
			"**\/tomb** - Enter a tomb by yourself or with others. Tag others to have them join you.\n" +
			"**\/join** - Join a preexisting party in a tomb. Tag the a user of the party you want to join and other users you want to join with you.\n" +
			"**\/inspectchest** - Open a chest in a tomb for an item. Can only be used if you have been tagged in or used \/tomb.\n" +
			"**\/party** - View the members of your adventuring party. Can only be used if you have been tagged in or used \/tomb.\n" +
			"**\/exit** - Leave a tomb by yourself or with others. Tag others to have them join you.\n" +
			"**\/inventory** - Lists items you have collected.\n" +
			"**\/give** - Give an item to another person. Tag them to give them the item.\n" +
			"**\/consume** - Consumes an item in your inventory.\n" +
			"**\/profile** - Lists items that have been consumed.\n" +
			"**\/bloodlust** - Rolls a bloodlust check. To be used by vampires to see if they give into their urges.\n" +
			"**\/bless** - Creates holy water and adds it to your inventory.\n" +
			"**\/readcure** - Read a cure book.\n" +
			"**\/cure** - Cure yourself or another willing vampire of their affliction.\n" +
			"**\/forcecure** - Forcefully cure a vampire of their affliction.\n" +
			"## Minecraft RP Commands\n" +
			"**\/sessionstart** - Starts the Minecraft session. Also starts the server if it's not active.\n" +
			"**\/sessionend** - Ends the Minecraft session.\n\n" +
			"Check out the bot's status: [here](https://discord.com/channels/1443304941711261696/1445189386416423014/1450902619257045004)\n" +
			"Link to the documentation: [here](https://docs.google.com/document/d/1tmNFFXo34ELh7KZDmYiPH_q7yvZLxRJrUYqQunyRrMM/edit?usp=sharing)\n\n" +
			"*React with ❌ to delete this message*";

		const reply = await interaction.reply({ content: helpText, fetchReply: true });
		
		// Add cross mark reaction
		await reply.react('❌');
		
		// Create reaction collector
		const filter = (reaction, user) => {
			return reaction.emoji.name === '❌' && user.id === interaction.user.id;
		};
		
		const collector = reply.createReactionCollector({ filter, time: 300000, max: 1 });
		
		collector.on('collect', async () => {
			await reply.delete();
		});
    },
};