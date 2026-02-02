const {SlashCommandBuilder, MessageFlags} = require("discord.js");
const {inventory, tombs} = require('../../models/keys.js');

const Responses = [
    "Turn Undead",
    "Lantern Thrash",
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

const cureBooks = [
	"Cure Book: The Remedy",
	"Cure Book: The Cure",
	"Cure Book: The Absolution",
	"Cure Book: The Retribution"
]

module.exports = {
	data: new SlashCommandBuilder()
		.setName('inspectchest')
		.setDescription('Inspect a chest found in a tomb'),
	async execute(interaction)
    {
		const threadID = interaction.channel.id;
		const interactionGuildMember= await interaction.guild.members.fetch(interaction.user.id);
		const userID = interactionGuildMember.user.id;

		const itemDoc = await tombs.findOne({ 
        	threadID: threadID
      	});

		if (!itemDoc || itemDoc.length === 0) {
			return await interaction.reply({
				content: 'You are not in a tomb.',
				flags: MessageFlags.Ephemeral
			});
		}
		else if(!itemDoc.members.includes(userID))
		{
			await interaction.reply
			({
				content: 'You are not in a tomb.',
				flags: MessageFlags.Ephemeral
			});
		}
		else if(itemDoc.members.includes(userID))
		{
			// Cure books have a 30% chance of showing up
			const isCureBook = Math.random() < 0.30;
			let tome;
			
			if (isCureBook) {
				const Response = Math.floor(Math.random() * cureBooks.length);
				tome = cureBooks[Response];
			} else {
				const Response = Math.floor(Math.random() * Responses.length);
				tome = Responses[Response];
			}
			
			await interaction.reply(`\`\`\`\nYour hand reaches into the chest, and with an instinctual motion the lid swings backwards, as if on instinct. A singular ancient tome lay inside the chest, emitting a soft iridescent glow and an overwhelming aura of divine and holy energy that leave a heavy impression on you as soon as your hand grasps it. Upon closer inspection, the ancient tome has a singular line of text reading __**${tome}.**__\`\`\`\n\`\`\`The tome suddenly enters your possession. (Use /inventory to view)\`\`\`\n\`\`\`You are given a choice - to read and consume this book, or share this gift to another person. If you consume these books, you will learn and wield it\'s powers gifted to you. (Use /give to share, or /consume to use the tome)\`\`\``);
			// Find or create user's inventory
			let userInventory = await inventory.findOne({ userID: userID });
			
			if (!userInventory) {
				// Create new inventory if it doesn't exist
				userInventory = await inventory.create({
					userID: userID,
					tomes: [{ name: tome, quantity: 1 }]
				});
			} else {
				// Check if tome already exists in inventory
				const existingTome = userInventory.tomes.find(t => t.name === tome);
				
				if (existingTome) {
					// Increment quantity if tome exists
					existingTome.quantity += 1;
					await userInventory.save();
				} else {
					// Add new tome if it doesn't exist
					userInventory.tomes.push({ name: tome, quantity: 1 });
					await userInventory.save();
				}
			}
		}
	},
};