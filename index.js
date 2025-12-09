require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const { token } = require('./config.json');

const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
mongoose.connect(uri).then(console.log('Connected to Mongodb.'));

const client = new Client
(
	{ intents: 
		[
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.GuildIntegrations,
			GatewayIntentBits.GuildMessageTyping,
			GatewayIntentBits.GuildMessageReactions,
			GatewayIntentBits.GuildPresences
		]
	}
);

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders)
{
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles)
	{
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command)
		{
			client.commands.set(command.data.name, command);
		}
		else
		{
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.once(Events.ClientReady, () =>
{
	console.log('VSMP bot online');
	client.user.setActivity({
		type: ActivityType.Custom,
		name: 'status',
		state: 'Sucking blood',
	});
});

client.on(Events.InteractionCreate, async interaction =>
{

	if (interaction.isAutocomplete()) {
		const command = client.commands.get(interaction.commandName);
		
		if (!command || !command.autocomplete) return;
		
		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.error('Error in autocomplete:', error);
		}
		return;
    }

	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try
	{
		await command.execute(interaction);
	}
	catch (error)
	{
		console.error(error);
		if (interaction.replied || interaction.deferred)
		{
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		}
		else
		{
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.login(token);

//USE node deploy.js