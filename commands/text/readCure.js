const {SlashCommandBuilder, MessageFlags} = require("discord.js");
const {inventory, profile} = require('../../models/keys.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('readcure')
        .setDescription('Read a cure book')
        .addStringOption((option) => option.setName('tome').setDescription(`The tome you're reading`).setRequired(true).setAutocomplete(true)),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const focusedOption = interaction.options.getFocused(true);
        
        // If autocompleting the item field
        if (focusedOption.name === 'tome') {
            try {
                const userID = interaction.user.id;
                const userInventory = await inventory.findOne({ 'userID': userID});
                
                if(!userInventory || userInventory.tomes.length === 0) {
                    await interaction.respond([]);
                    return;
                }
                
                const filtered = userInventory.tomes
                    .filter(tome => tome.name.toLowerCase().startsWith('cure book'))
                    .filter(tome => tome.name.toLowerCase().includes(focusedValue))
                    .slice(0, 25)
                    .map(tome => ({
                        name: `${tome.name} (x${tome.quantity})`,
                        value: tome.name
                    }));
                
                await interaction.respond(filtered);
                
            } catch (error) {
                console.error('Error in autocomplete:', error);
                await interaction.respond([]);
            }
        }
    },

    async execute(interaction) {
        const itemName = interaction.options.getString('tome');
        const interactionGuildMember = await interaction.guild.members.fetch(interaction.user.id);
        const userID = interactionGuildMember.user.id;

        try {
            // Find user's inventory
            const userInventory = await inventory.findOne({ 'userID': userID});
            
            if (!userInventory || userInventory.tomes.length === 0) {
                return await interaction.reply({
                    content: 'You don\'t have any items in your inventory!',
                    flags: MessageFlags.Ephemeral
                });
            }
            
            // Find the specific item
            const itemDoc = userInventory.tomes.find(t => t.name === itemName);
            
            if (!itemDoc) {
                return await interaction.reply({
                    content: `You don't have a "${itemName}" in your inventory!`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Check if already consumed
            let userProfile = await profile.findOne({ 'userID': userID });
            const alreadyConsumed = userProfile && userProfile.consumedTomes.includes(itemName);

            // If already read this tome, send a different message
            if (alreadyConsumed) {
                return await interaction.reply({
                    content: `You've already read this tome.`,
                    flags: MessageFlags.Ephemeral
                });
            }

            // Add to consumed tomes if not already consumed
            if (!userProfile) {
                userProfile = await profile.create({
                    'userID': userID,
                    'consumedTomes': [itemName]
                });
            } else {
                userProfile.consumedTomes.push(itemName);
                await userProfile.save();
            }
        
            // Determine which tome is being read
            let replyText = '';
            if (itemName === 'Cure Book: The Remedy') {
                replyText = `\`\`\`ansi\n[0;2m[0;35m[1;35m THE REMEDY [0m[0;35m[0m[0m\n\nPART I OF III\n\nIn the darkest hours, when the cursed blood burns within your veins, know that salvation exists. The ancients spoke of a trinity of knowledge, that when combined can sever the unholy bond between mortal and monster. This is the first piece of that forbidden knowledge.\n\nRead on, seeker of the light.\`\`\``;
            } else if (itemName === 'Cure Book: The Cure') {
                replyText = `\`\`\`ansi\n[2;35m[1;35m THE CURE[0m[2;35m[0m\n\nPART II OF III\n\n The second fragment reveals the nature of the curse itself. Born of darkness, sustained by blood, the vampire's existence is a perversion of nature's order, yet within this perversion lies the key to its undoing.\nHoly water, blessed by the righteous, weakens the bond.\n\nContinue your search, truth seeker.\`\`\``;
            } else if (itemName === 'Cure Book: The Absolution') {
                replyText = `\`\`\`ansi\n[2;35m THE ABSOLUTION [0m\n\nPART III OF III\n\nThe final piece completes the trinity. With all three fragments of knowledge, the words of power are revealed.\n\n[2;33m[1;33m[4;33mvoluntate-mea-hoc-nefandum-vinculum-abici [0m[1;33m[0m[2;33m[0m\n\nStand near a holy beacon, with holy water upon your person beneath the light of day.\nSpeak the words, and be free of the curse forevermore.\n\nMay the light guide your path.\`\`\``;
            } else if (itemName === 'Cure Book: The Retribution') {
                replyText = `\`\`\`ansi\n[2;31m[2;40mTHE RETRIBUTION [0m[2;31m[0m\n\nThe Fourth Tome.\n\nThis knowledge was never meant to be found. While the trinity speaks of self-salvation, this tome reveals darker words - words of forced redemption... or forced damnation.\n\n[2;40m[2;31m[1;31mhoc-vinculum-tibi-diru-mpo-mala-creatura [0m[2;31m[2;40m[0m[2;40m[0m\n\nwith these words, you may force the choice upon another creature of the night.\n\nUse this power wisely, for it carries great consequence.\`\`\``;
            } else {
                replyText = `There's a time and place for everything but not now!`;
            }

            await interaction.reply(`${replyText}`);

            // Check if user has read all three required tomes
            const requiredTomes = [
                'Cure Book: The Remedy',
                'Cure Book: The Cure',
                'Cure Book: The Absolution'
            ];
            
            const allCureBooks = requiredTomes.every(tome => userProfile.consumedTomes.includes(tome));

            // Check if user has read all tomes including the secret fourth one
            const allTomes = [
                'Cure Book: The Remedy',
                'Cure Book: The Cure',
                'Cure Book: The Absolution',
                'Cure Book: The Retribution'
            ];

            const secretFourth = allTomes.every(tome => userProfile.consumedTomes.includes(tome));

            if (secretFourth) {
                await interaction.followUp(`\`\`\`You have absorbed the knowledge from all three cure books. You now know the words to cure yourself from vampirism.\n\nStand near a holy beacon, with a bottle of holy water on your person, and in the light of the day, say those words, and be free.\`\`\``);
                await interaction.followUp(`\`\`\`You have learned the vengeful words to force cure others. You and the creature must be within range of a holy beacon, hold a bottle of holy water on your person, and in the light of day, say those words and give them the final choice\`\`\``);
            } else if (allCureBooks) {
                await interaction.followUp(`\`\`\`You have absorbed the knowledge from all three cure books. You now know the words to cure yourself from vampirism.\n\nStand near a holy beacon, with a bottle of holy water on your person, and in the light of the day, say those words, and be free.\`\`\``);
            }

        } catch (error) {
            console.error('Error in readcure command:', error);
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'An error occurred while reading the tome.',
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({
                    content: 'An error occurred while reading the tome.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};