const { SlashCommandBuilder } = require("discord.js");
const { ensureServerOnline, runServerCommand } = require("../../exaroton");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sessionstart")
        .setDescription("Starts the session"),

    async execute(interaction) {
        const username = interaction.options.getString("player");

        await interaction.reply(`Checking server is online...`);

        try {
            // Ensure server is online
            await ensureServerOnline(interaction);

            await interaction.followUp("Server is online. Starting session.");

            await runServerCommand("pow admin session resume");

            await interaction.followUp(`Session has started`);

        } catch (err) {
            console.error(err);
            await interaction.followUp("Something went wrong while starting the server or sending commands.");
        }
    }
};
