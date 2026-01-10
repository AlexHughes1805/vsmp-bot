const {SlashCommandBuilder, MessageFlags} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bloodlust')
		.setDescription('See if you give into your vampiric urges or not'),

	async execute(interaction)
    {
		const interactionGuildMember = await interaction.guild.members.fetch(interaction.user.id);
        const userRoles = interactionGuildMember.roles.cache;

        const result = 1 + Math.floor(Math.random() * 20); // lich just a dice roller lol, it's a d20

        const dc = 14; // dc means difficulty class, the number the user has to meet or beat to pass the check
		
        if (userRoles.some(role => role.name === 'vampires'))
        {
            if(result < dc)
            {
                await interaction.reply(`You rolled a **${result}**\n\n\`\`\`Your thirst for human blood overthrows any moral sensation holding you back. You have failed the bloodlust check.\`\`\``);
            }
            else
            {
                await interaction.reply(`You rolled a **${result}**\n\n\`\`\`Your thirst for human blood is overthrown internally. You supress the urge to feed on human blood. You have passed the bloodlust check.\`\`\``);
            }
            
        }
        else if (userRoles.some(role => role.name === 'humans'))
        {
            return await interaction.reply({
                content: 'Only vampires can execute this command',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};