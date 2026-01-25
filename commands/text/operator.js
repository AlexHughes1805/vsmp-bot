const { SlashCommandBuilder } = require("discord.js");
const { ensureServerOnline, runServerCommand } = require("../../exaroton");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sessionstart")
        .setDescription("Gives the user operator for 5 minutes and starts the session")
        .addStringOption(option => option.setName("player").setDescription("Your Minecraft username").setRequired(true)),

    async execute(interaction) {
        const username = interaction.options.getString("player");

        await interaction.reply(`Checking server is online...`);

        try {
            // Ensure server is online
            await ensureServerOnline(interaction);

            // Make user operator
            // await runServerCommand(`op ${username}`);

            await interaction.followUp("Server is online. Making user operator and starting session.");

            await runServerCommand("pow admin session resume");

            await interaction.followUp(`Session has started`);

            // Remove operator after 5 minutes
            setTimeout(async () => {
                try {
                    await runServerCommand(`deop ${username}`);
                } catch (err) {
                    console.error("Failed to remove operator:", err);
                }
            }, 5 * 60 * 1000);
        } catch (err) {
            console.error(err);
            await interaction.followUp("Something went wrong while starting the server or sending commands.");
        }
    }
};
