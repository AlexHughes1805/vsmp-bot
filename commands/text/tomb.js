const {SlashCommandBuilder, MessageFlags} = require("discord.js");
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
		.setDescription('Enter a tomb')
        .addUserOption((option) => option.setName('user2').setDescription(`Party member 2`).setRequired(false))
        .addUserOption((option) => option.setName('user3').setDescription(`Party member 3`).setRequired(false))
        .addUserOption((option) => option.setName('user4').setDescription(`Party member 4`).setRequired(false))
        .addUserOption((option) => option.setName('user5').setDescription(`Party member 5`).setRequired(false))
        .addUserOption((option) => option.setName('user6').setDescription(`Party member 6`).setRequired(false)),

	async execute(interaction)
    {
        const threadID = interaction.channel.id;
		const interactionGuildMember = await interaction.guild.members.fetch(interaction.user.id);
		const userID = interactionGuildMember.user.id;
        const userRoles = interactionGuildMember.roles.cache;

        const mentioned = [
        interaction.options.getUser('user2'),
        interaction.options.getUser('user3'),
        interaction.options.getUser('user4'),
        interaction.options.getUser('user5'),
        interaction.options.getUser('user6')
        ].filter(user => user !== null && ! user.bot);

        const members = [userID];

        for (const user of mentioned) {
            if (!members.includes(user.id) && members.length < 6) {
                members.push(user.id);
            }
        }
        
        const memberList = members.map((memberId, index) => {
            return `${index + 1}. <@${memberId}>`;
        });

        for (const id of members) {
            const userInTomb = await tombs.findOne({ members: id });
            if (userInTomb) {
                return await interaction.reply({
                    content: `<@${id}> is already in a tomb`,
                    flags: MessageFlags.Ephemeral
                });
            }
        }
        
        const Response = Math.floor(Math.random() * Responses.length);
		
        if (userRoles.some(role => role.name === 't!vampire'))
        {
            await interaction.reply(`\`\`\`\nYou, or you and your party arrive at the stone structure. It looks identical to the ones around Oakhurst, and have often been identified as a tomb. There are cobbled, worn down stairs in the center, with a gap below and a water elevator in the center, that seemingly functions up and down. With the descent into the tomb, your eyes feel relieved at the cooling feeling -  the sting of the light lessens, and you feel an uncertain shift within you as you enter. You have entered a tomb.\`\`\`\n\`\`\`Ahead, you see clearly - the details of the tomb are clear and it feels strongly of death. The walls are clearly cobbled, and skulls and cobwebs adorn the walls and floors, alongside unlit candles. You notice the single chest ahead first - it feels holy in a way that repels you, but you can choose to ignore it in favour of concealing your identity.\`\`\`\nParty Members:\n${memberList.join('\n')}`);
        }
        else if (userRoles.some(role => role.name === 't!human'))
        {
            await interaction.reply(`\`\`\`\nYou, or you and your party arrive at the stone structure. It looks identical to the ones around Oakhurst, and have often been identified as a tomb. There are cobbled, worn down stairs in the center, with a gap below and a water elevator in the center, that seemingly functions up and down. The intensity of light lessens as you descend into the floor - the structure smells damp and wet. A cold chill runs through you, and it’s far harder to identify where you are. You have entered a tomb.\`\`\`\n\`\`\`All you see ahead of you are cobbled stone walls, skulls and cobwebs adorning the walls and floors, and some unlit candles. The smell of damp is almost overwhelming, and it’s far darker here than expected. There is a single chest ahead, with an almost archaic, but nostalgic look, but it doesn’t look rusted, just out of fashion. A strong pull emanates from the chest.\`\`\`\nParty Members:\n${memberList.join('\n')}`);
        }

		await new tombs
		({
            threadID: threadID,
			members: members,
			tomb: `${Responses[Response]}`,
		}).save();
	},
};