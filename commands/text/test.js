const {SlashCommandBuilder} = require("discord.js");

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
		const Response = Math.floor(Math.random() * Responses.length);
		await interaction.reply(`${Responses[Response]}`);
	},
};