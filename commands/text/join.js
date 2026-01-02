const {SlashCommandBuilder, MessageFlags} = require("discord.js");
const {tombs} = require('../../models/keys.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('join')
		.setDescription('Join another person in a tomb')
        .addUserOption((option) => option.setName('target').setDescription(`User whose party you want to join`).setRequired(true))
        .addUserOption((option) => option.setName('user2').setDescription(`Party member 2`).setRequired(false))
        .addUserOption((option) => option.setName('user3').setDescription(`Party member 3`).setRequired(false))
        .addUserOption((option) => option.setName('user4').setDescription(`Party member 4`).setRequired(false))
        .addUserOption((option) => option.setName('user5').setDescription(`Party member 5`).setRequired(false)),
	async execute(interaction)
    {
		const threadID = interaction.channel.id;
		const interactionGuildMember = await interaction.guild.members.fetch(interaction.user.id);
		const userID = interactionGuildMember.user.id;
        const target = interaction.options.getUser('target');
        
		const itemDoc = await tombs.findOne({ 
        	threadID: threadID
      	});

		if (!itemDoc) {
			return await interaction.reply({
				content: 'This party does not exist',
				flags: MessageFlags. Ephemeral
			});
		}

        if (!itemDoc.members.includes(target.id)) {
			return await interaction.reply({
				content: 'This user is not in this tomb',
				flags: MessageFlags. Ephemeral
			});
		}

        const mentioned = [
			interaction.options.getUser('user2'),
			interaction.options. getUser('user3'),
			interaction.options.getUser('user4'),
			interaction.options. getUser('user5')
        ].filter(user => user !== null && ! user.bot);

		const mentionedIds = mentioned.map(user => user.id);

        // Check if any mentioned users are already in tombs
        for (const id of mentionedIds) {
            const userInTomb = await tombs.findOne({ members: id });
            if (userInTomb) {
                return await interaction.reply({
                    content: `<@${id}> is already in a tomb`,
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        const newMembers = mentionedIds.filter(id => 
			!itemDoc.members.includes(id) && id !== userID
		);

		const newUsers = [...newMembers, userID];

        if (itemDoc.members.length === 6)
        {
            return await interaction.reply({
				content: 'This party is full',
				flags: MessageFlags. Ephemeral
			});
        }

		if (target.id === userID) {
			return await interaction.reply({
				content: 'You cannot join yourself',
				flags: MessageFlags.Ephemeral
			});
		}

        if (itemDoc.members.length + newUsers.length > 6)
        {
            return await interaction.reply({
				content: 'Maximum party members exceeded',
				flags: MessageFlags. Ephemeral
			});
        }

        const updatedDoc = await tombs.findOneAndUpdate(
            { _id: itemDoc._id },
            { $addToSet: { members: { $each: newUsers } } },
			{ new: true }
        );

		// Build list of new party members including the original ones
		const newList = updatedDoc.members.map((id, index) => {
			return `${index +1}. <@${id}>`;
		});

		await interaction.reply(`You have joined a party in a tomb.\n\n**Party Members:**\n${newList.join('\n')}`);
	},
};