const {SlashCommandBuilder} = require("discord.js");
const {tomes} = require('../../models/keys.js');

const Responses = [
    "Turn Undead",
    "Lanturn Thrash",
    "Holy Word",
    "Prospector",
    "Prayer",
	"Shoulder Barge",
	"Way of the Land",
	"Unnatural Haste",
	"Blessing",
	"Banish Undead",
	"Rallying Cry",
	"Enlightened Eye",
	"Uncanny Direction",
	"Way of Lumberjack"
];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('inspectchest')
		.setDescription('Inspect a chest found in a tomb'),
	async execute(interaction)
    {
		const interactionGuildMember= await interaction.guild.members.fetch(interaction.user.id);
		const userID = interactionGuildMember.user.id;

		const Response = Math.floor(Math.random() * Responses.length);
		await interaction.reply(`You reach into the chest and pick up a tome. It reads: ${Responses[Response]}`);

		new tomes
		({
			userID: userID,
			tome: `${Responses[Response]}`
		}).save();
	},
};