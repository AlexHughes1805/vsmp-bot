const { SlashCommandBuilder } = require("discord.js");
const { ensureServerOnline, runServerCommand } = require("../../exaroton");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sessionend")
        .setDescription("Ends the session"),

    async execute(interaction) {
        const username = interaction.options.getString("player");

        await interaction.reply(`Checking server is online...`);

        try {
            // Ensure server is online
            await ensureServerOnline(interaction);

            await interaction.followUp("Server is online. Ending session.");

            await runServerCommand("pow admin session pause");

            await interaction.followUp(`Session has ended`);
        } catch (err) {
            console.error(err);
            await interaction.followUp("Something went wrong while starting the server or sending commands.");
        }
    }
};
