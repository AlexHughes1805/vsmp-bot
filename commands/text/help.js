const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Shows available commands and their descriptions'),
	async execute(interaction) {
		const generalEmbed = new EmbedBuilder()
			.setColor(0x5865F2)
			.setTitle('Help Menu')
			.setDescription('Welcome to the VSMP Bot help menu!\n\nUse the buttons below to navigate between different command categories.')
			.addFields(
				{ name: 'Minecraft Commands', inline: false },
				{ name: 'Text RP Commands', inline: false },
				{ name: '\u200B', value: '\u200B', inline: false },
				{ name: 'Resources', value: '[Bot Status](https://discord.com/channels/1443304941711261696/1445189386416423014/1450902619257045004)\n[Documentation](https://docs.google.com/document/d/1tmNFFXo34ELh7KZDmYiPH_q7yvZLxRJrUYqQunyRrMM/edit?usp=sharing)', inline: false }
			)
			.setTimestamp();

		const minecraftEmbed = new EmbedBuilder()
			.setColor(0x00AA00)
			.setTitle('Minecraft Commands')
			.setDescription('Commands for managing the Minecraft server session')
			.addFields(
				{ name: '/startsession', value: 'Starts the Minecraft session. Also starts the server if it\'s not active.', inline: false },
				{ name: '/endsession', value: 'Ends the Minecraft session.', inline: false }
			)
			.setTimestamp();

		const textRPEmbed = new EmbedBuilder()
			.setColor(0xAA0000)
			.setTitle('Text RP Commands')
			.setDescription('Commands for text-based roleplay adventures')
			.addFields(
				{ name: '/tomb', value: 'Enter a tomb by yourself or with others. Tag others to have them join you.', inline: false },
				{ name: '/join', value: 'Join a preexisting party in a tomb. Tag a user of the party you want to join and other users you want to join with you.', inline: false },
				{ name: '/inspectchest', value: 'Open a chest in a tomb for an item. Can only be used if you have been tagged in or used /tomb.', inline: false },
				{ name: '/party', value: 'View the members of your adventuring party. Can only be used if you have been tagged in or used /tomb.', inline: false },
				{ name: '/exit', value: 'Leave a tomb by yourself or with others. Tag others to have them join you.', inline: false },
				{ name: '/inventory', value: 'Lists items you have collected.', inline: false },
				{ name: '/give', value: 'Give an item to another person. Tag them to give them the item.', inline: false },
				{ name: '/consume', value: 'Consumes an item in your inventory.', inline: false },
				{ name: '/profile', value: 'Lists items that have been consumed.', inline: false },
				{ name: '/bloodlust', value: 'Rolls a bloodlust check. To be used by vampires to see if they give into their urges.', inline: false },
				{ name: '/bless', value: 'Creates holy water and adds it to your inventory.', inline: false },
				{ name: '/readcure', value: 'Read a cure book.', inline: false },
				{ name: '/cure', value: 'Cure yourself or another willing vampire of their affliction.', inline: false },
				{ name: '/forcecure', value: 'Forcefully cure a vampire of their affliction.', inline: false },
				{ name: '/farkle', value: 'Play Farkle against another player or a bot.', inline: false },
				{ name: '/roll', value: 'Roll dice (d4, d6, d8, d10, d12, d20).', inline: false }
			)
			.setTimestamp();

		const generalButton = new ButtonBuilder()
			.setCustomId('help_general')
			.setLabel('General')
			.setEmoji('📚')
			.setStyle(ButtonStyle.Primary);

		const minecraftButton = new ButtonBuilder()
			.setCustomId('help_minecraft')
			.setLabel('Minecraft')
			.setEmoji('🎮')
			.setStyle(ButtonStyle.Success);

		const textRPButton = new ButtonBuilder()
			.setCustomId('help_textrp')
			.setLabel('Text RP')
			.setEmoji('🎭')
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder().addComponents(generalButton, minecraftButton, textRPButton);

		const response = await interaction.reply({
			embeds: [generalEmbed],
			components: [row]
		});

		const collector = response.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 300000 // 5 minutes
		});

		collector.on('collect', async i => {
			let embed;
			
			if (i.customId === 'help_general') {
				embed = generalEmbed;
			} else if (i.customId === 'help_minecraft') {
				embed = minecraftEmbed;
			} else if (i.customId === 'help_textrp') {
				embed = textRPEmbed;
			}

			await i.update({
				embeds: [embed],
				components: [row]
			});
		});

		collector.on('end', async () => {
			try {
				await response.edit({ components: [] });
			} catch (error) {
				// Message might have been deleted
			}
		});
	},
};