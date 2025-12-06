const {SlashCommandBuilder} = require("discord.js");
const tomes = require('../../models/keys.js');

const Responses = [
    "image 1",
    "image 2",
    "image 3",
    "image 4",
    "image 5"
];



module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('Testing the bot'),
	async execute(interaction)
    {
		const interactionGuildMember= await interaction.guild.members.fetch(interaction.user.id);
		const userID = interactionGuildMember.user.id;

		const Response = Math.floor(Math.random() * Responses.length);
		await interaction.reply(`${Responses[Response]}`);

		new tomes
		({
			userID: userID,
			tome: `${Responses[Response]}`
		}).save();
	},
};