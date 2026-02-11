const {SlashCommandBuilder} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Roll a die')
        .addStringOption((option) => 
			option.setName('sides')
				.setDescription('Choose the number of sides')
				.setRequired(true)
				.addChoices(
					{ name: 'd4', value: '4' },
					{ name: 'd6', value: '6' },
					{ name: 'd8', value: '8' },
					{ name: 'd10', value: '10' },
					{ name: 'd12', value: '12' },
					{ name: 'd20', value: '20' }
				)),

	async execute(interaction)
    {
        const sides = parseInt(interaction.options.getString('sides'));
        const result = 1 + Math.floor(Math.random() * sides);
		
        await interaction.reply(`Rolled d${sides}: **${result}**`);
            
    },
};