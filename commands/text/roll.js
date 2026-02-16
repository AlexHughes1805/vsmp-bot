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
				))
		.addIntegerOption((option) =>
			option.setName('quantity')
				.setDescription('Number of dice to roll (default: 1)')
				.setRequired(false)
				.setMinValue(1)
				.setMaxValue(100)),

	async execute(interaction)
    {
        const sides = parseInt(interaction.options.getString('sides'));
		const quantity = interaction.options.getInteger('quantity') || 1;
        
		// Roll the dice
		const rolls = [];
		for (let i = 0; i < quantity; i++) {
			rolls.push(1 + Math.floor(Math.random() * sides));
		}
		
		const total = rolls.reduce((sum, roll) => sum + roll, 0);
		
		// Format the response
		if (quantity === 1) {
			await interaction.reply(`Rolled d${sides}: **${total}**`);
		} else {
			const rollsString = rolls.join(' + ');
			await interaction.reply(`Rolled ${quantity}d${sides}: **${total}** (${rollsString})`);
		}
            
    },
};