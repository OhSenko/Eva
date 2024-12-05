const { SlashCommandBuilder } = require('discord.js');
const sharp = require('sharp');
const { Canvas, FontLibrary } = require('skia-canvas');
const path = require('path');

// I STOLE THIS ENTIRE FILE FROM THE INTERNET
// I DON'T KNOW HOW TO USE IT
// I JUST WANT TO MAKE CAPTIONS
// I DON'T CARE HOW IT WORKS
// I JUST WANT TO MAKE CAPTIONS

const fontPath = path.join(__dirname, '../../assets/fonts/impact.ttf');
FontLibrary.use('CustomImpact', fontPath);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('caption')
        .setDescription('Add a caption to an image')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('The caption text')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('The image to caption')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const text = interaction.options.getString('text');
        const attachment = interaction.options.getAttachment('image');

        // Validate file is an image
        if (!attachment.contentType?.startsWith('image/')) {
            return interaction.editReply('Please provide a valid image file.');
        }

        try {
            // Download the image
            const imageResponse = await fetch(attachment.url);
            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

            // Get original image dimensions
            const metadata = await sharp(imageBuffer).metadata();
            const { width } = metadata;

            // Calculate banner height and font size
            const bannerHeight = Math.max(Math.floor(width * 0.2), 80);
            const fontSize = Math.min(bannerHeight * 0.6, width * 0.1);

            // Create canvas for the text
            const canvas = new Canvas(width, bannerHeight);
            const ctx = canvas.getContext('2d');

            // Set white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, bannerHeight);

            // Configure text
            ctx.fillStyle = 'black';
            ctx.font = `bold ${fontSize}px CustomImpact`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Add text with stroke
            const x = width / 2;
            const y = bannerHeight / 2;
            
            // Draw stroke
            ctx.lineWidth = fontSize * 0.05; // Stroke width proportional to font size
            ctx.strokeStyle = 'white';
            ctx.strokeText(text, x, y);
            
            // Draw text
            ctx.fillStyle = 'black';
            ctx.fillText(text, x, y);

            // Convert canvas to buffer
            const bannerBuffer = await canvas.toBuffer('png');

            // Combine banner and original image
            const finalImage = await sharp(bannerBuffer)
                .extend({
                    top: 0,
                    bottom: metadata.height,
                    left: 0,
                    right: 0,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                })
                .composite([
                    {
                        input: imageBuffer,
                        top: bannerHeight,
                        left: 0,
                    }
                ])
                .png()
                .toBuffer();

            // Send the result
            await interaction.editReply({
                files: [{
                    attachment: finalImage,
                    name: 'captioned-image.png'
                }]
            });

        } catch (error) {
            console.error('Error processing image:', error);
            await interaction.editReply('Sorry, there was an error processing your image.');
        }
    }
}; 