const {SlashCommandBuilder, MessageFlags, EmbedBuilder} = require("discord.js");
const {profile, inventory} = require('../../models/keys.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bless')
		.setDescription('Create holy water'),
	async execute(interaction)
    {
		const interactionGuildMember= await interaction.guild.members.fetch(interaction.user.id);
		const userID = interactionGuildMember.user.id;
        const userProfile = await profile.findOne({ 'userID': userID});

        if(!userProfile || userProfile.consumedTomes.length === 0 )
        {
            await interaction.reply
            ({
                content: 'You have not consumed any tomes',
                flags: MessageFlags.Ephemeral
            });
        }
        else if (!userProfile.consumedTomes.includes('Blessing'))
        {
            await interaction.reply
            ({
                content: 'You have not consumed the Blessing tome',
                flags: MessageFlags.Ephemeral
            });
        }

        else
        {
            await interaction.reply(`You have created holy water.`);

            let userInventory = await inventory.findOne({ userID: userID });
                        
            if (!userInventory) {
                // Create new inventory if it doesn't exist
                userInventory = await inventory.create({
                    userID: userID,
                    tomes: [{ name: 'Holy Water', quantity: 1 }]
                });
            } else {
                // Check if holy water already exists in inventory
                const existingTome = userInventory.tomes.find(t => t.name === 'Holy Water');
                
                if (existingTome) {
                    // Increment quantity if holy water exists
                    existingTome.quantity += 1;
                    await userInventory.save();
                } else {
                    // Add new holy water if it doesn't exist
                    userInventory.tomes.push({ name: 'Holy Water', quantity: 1 });
                    await userInventory.save();
                }
            }
        }
        
	},
};