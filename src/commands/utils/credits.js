/**
 * /credits — Crédits de Robonyan
 * Robonyan | Créé par ᴠʏᴢᴛᴏʀ
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('credits')
    .setDescription('🐱 Voir les crédits et infos de Robonyan'),

  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setTitle(`🐱 ${client.BOT_NAME} — Crédits`)
      .setDescription(`**${client.BOT_NAME}** est un bot Discord dédié aux Yo-kai.\nGacha, médaillium, modération, sondages et plus encore !`)
      .setThumbnail(client.user.displayAvatarURL())
      .setColor(0xFFD700)
      .addFields(
        { name: '👤 Créateur', value: `**${client.CREATOR}**`, inline: true },
        { name: '🤖 Bot', value: client.BOT_NAME, inline: true },
        { name: '⚙️ Version', value: `v${client.VERSION}`, inline: true },
        { name: '📚 Technologie', value: 'discord.js v14', inline: true },
        { name: '🌐 Serveur de support', value: 'https://discord.gg/K4H4xhHqUb', inline: false },
      )
      .setFooter({ text: `${client.BOT_NAME} • Créé par ${client.CREATOR}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
