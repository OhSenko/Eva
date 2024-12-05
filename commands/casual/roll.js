const { SlashCommandBuilder } = require('discord.js');

// more gambling addiction :3

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Roll the dice, because it is so very nice')
        .addStringOption(option =>
            option.setName('dice')
                .setDescription('Dice to roll (e.g., 2d20+1d6+3)')
                .setRequired(true)),

    async execute(interaction) {
        const diceInput = interaction.options.getString('dice').toLowerCase();
        const diceRegex = /(\d+)d(\d+)([+-]\d+)?/g;
        let matches = [...diceInput.matchAll(diceRegex)];
        
        if (matches.length === 0) {
            return interaction.reply('Invalid dice format! Use format like: 2d20+1d6+3');
        }

        let totalSum = 0;
        let rollDetails = [];

        for (const match of matches) {
            const [_, quantity, sides, modifier] = match;
            const numDice = parseInt(quantity);
            const numSides = parseInt(sides);
            
            if (![4, 6, 8, 10, 12, 20].includes(numSides)) {
                return interaction.reply(`Invalid die type: d${numSides}. Valid dice are: d4, d6, d8, d10, d12, d20`);
            }

            let rolls = [];
            for (let i = 0; i < numDice; i++) {
                rolls.push(Math.floor(Math.random() * numSides) + 1);
            }

            const sum = rolls.reduce((a, b) => a + b, 0);
            totalSum += sum;

            rollDetails.push(`${numDice}d${numSides}: [${rolls.join(', ')}] = ${sum}`);
        }

        const modifierMatch = diceInput.match(/([+-]\d+)$/);
        if (modifierMatch) {
            const modifier = parseInt(modifierMatch[1]);
            totalSum += modifier;
            rollDetails.push(`Modifier: ${modifier}`);
        }

        await interaction.reply(`🎲 **Roll Results:**\n${rollDetails.join('\n')}\n**Total:** ${totalSum}`);
    },
}; 