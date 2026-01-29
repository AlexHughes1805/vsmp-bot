require('dotenv').config();
// exaroton.js
const { Client } = require("exaroton");

const client = new Client(process.env.EXAROTON_API_KEY);

async function getServer() {
    return client.server(process.env.EXAROTON_SERVER_ID);
}

async function ensureServerOnline(interaction) {
    const server = await getServer();
    const serverInfo = await server.get();

    console.log("Server status:", serverInfo.status);

    // 0 = offline, 1 = online, 2 = starting, 3 = stopping
    if (serverInfo.status === 1) {
        await interaction.followUp({ content: "Server is already online.", ephemeral: true });
        return;
    }

    if (serverInfo.status === 0) {
        await interaction.followUp({ content: "Server is offline, starting it now…", ephemeral: true });
        await server.start();
    } else if (serverInfo.status === 2) {
        await interaction.followUp({ content: "Server is already starting, waiting for it to come online…", ephemeral: true });
    } else {
        await interaction.followUp({ content: `Unknown server status: ${serverInfo.status}`, ephemeral: true });
        return;
    }

    // Poll until online
    let attempts = 0;
    while (attempts < 60) {
        await new Promise(r => setTimeout(r, 3000));
        const updatedInfo = await server.get();
        if (updatedInfo.status === 1) return;
        attempts++;
    }

    throw new Error("Server took too long to start.");
}

async function runServerCommand(command) {
    const server = await getServer();
    return await server.executeCommand(command);
}

module.exports = { ensureServerOnline, runServerCommand };
