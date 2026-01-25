require('dotenv').config();
// exaroton.js
const { Client } = require("exaroton");

const client = new Client(process.env.EXAROTON_API_KEY);

async function getServer() {
    return client.server(process.env.EXAROTON_SERVER_ID);
}

async function ensureServerOnline(interaction) {
    const server = await getServer();
    await server.get();

    // 0 = offline, 1 = starting, 2 = online
    if (server.status === 2) return;

    await interaction.followUp("Server is offline — starting it now…");
    await server.start();

    // Poll until online
    let attempts = 0;
    while (attempts < 60) {
        await new Promise(r => setTimeout(r, 3000));
        await server.get();
        if (server.status === 2) return;
        attempts++;
    }

    throw new Error("Server took too long to start.");
}

async function runServerCommand(command) {
    const server = await getServer();
    return await server.executeCommand(command);
}

module.exports = { ensureServerOnline, runServerCommand };
