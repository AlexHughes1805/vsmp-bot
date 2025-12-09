const {SlashCommandBuilder} = require("discord.js");
const {tombs} = require('../../models/keys.js');

const Responses = [
    "Tomb 1",
    "Tomb 2",
    "Tomb 3",
    "Tomb 4",
    "Tomb 5",
	"Tomb 6"
];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tomb')
		.setDescription('Enter a tomb'),
	async execute(interaction)
    {
		const interactionGuildMember= await interaction.guild.members.fetch(interaction.user.id);
		const userID = interactionGuildMember.user.id;
        const userRoles = interactionGuildMember.roles.cache;

        const Response = Math.floor(Math.random() * Responses.length);
		
        if (userRoles.some(role => role.name === 'vampires'))
        {
            await interaction.reply(`You descend down the stairs, cobbled and worn down from frequent use. They feel unstable, loose stone falling from the stairs, as you continue to descend. The sting of the daylight lessens as you descend further into the darkness, and feel your eyes relax. You blink, and see everything. Every little detail. It feels.. familiar. You have entered a Tomb. `);
        }
        else if (userRoles.some(role => role.name === 'humans'))
        {
            await interaction.reply(`You, or you and your party, descend down the stairs - cobbled and worn down from frequent use. They feel unstable, loose stone falling from the stairs, as you continue to descend. The intensity of the daylight lessens as you continue further, and further, until you reach the floor. A cold chill runs through you, and darkness pools around your sight. It’s harder to identify where you are, but upon closer inspection: you have entered a Tomb.`);
        }

		/* new tombs
		({
			userID: userID,
			tomb: `${Responses[Response]}`
		}).save(); */
	},
};