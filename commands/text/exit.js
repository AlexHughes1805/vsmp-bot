const {SlashCommandBuilder, MessageFlags} = require("discord.js");
const {tombs} = require('../../models/keys.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('exit')
		.setDescription('Exit a tomb')
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
        
		const itemDoc = await tombs.findOne({ 
        	threadID: threadID
      	});

		if (!itemDoc) {
			return await interaction.reply({
				content: 'You are not in a tomb.',
				flags: MessageFlags. Ephemeral
			});
		}

		if (! itemDoc.members.includes(userID)) {
			return await interaction.reply({
				content: 'You are not in a tomb.',
				flags: MessageFlags. Ephemeral
			});
		}

        const mentioned = [
			interaction.options.getUser('user2'),
			interaction.options. getUser('user3'),
			interaction.options.getUser('user4'),
			interaction.options. getUser('user5'),
			interaction.options.getUser('user6')
        ].filter(user => user !== null && ! user.bot);

		const mentionedIds = mentioned.map(user => user.id);

        const validKicks = mentionedIds.filter(id => 
			itemDoc.members.includes(id) && id !== userID
		);

		const usersToRemove = [...validKicks, userID];

        const updatedDoc = await tombs.findOneAndUpdate(
            { _id: itemDoc._id },
            { $pull: { members:  { $in: usersToRemove } } },
			{ new: true }
        );

		// Build list of those who left
		const leftList = usersToRemove.map((id, index) => {
			return `${index + 1}. <@${id}>`;
		});

        if (updatedDoc.members.length === 0) {
            await tombs.findByIdAndDelete(updatedDoc._id);
			return await interaction.reply(`You have exited the tomb.\n**Exited the tomb:**\n${leftList.join('\n')}\n\nThere are no more party members in the tomb.`);
        }

		// Build list of those who remain
		const remainingList = updatedDoc.members.map((id, index) => {
			return `${index +1}. <${id}>`;
		});

		await interaction.reply(`You have exited the tomb.\n**Exited the tomb:**\n${leftList.join('\n')}\n\n**Still in the tomb:**\n${remainingList.join('\n')}}`);
	},
};