/**
 * /orbes — Voir ses orbes oni
 * Robonyan | Créé par ᴠʏᴢᴛᴏʀ
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getOrbes } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('orbes')
    .setDescription('🔮 Voir votre solde d\'orbes oni')
    .addUserOption(o => o.setName('joueur').setDescription('Joueur à consulter').setRequired(false))
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply();
    const target = interaction.options.getUser('joueur') || interaction.user;
    const amount = getOrbes(target.id);

    const embed = new EmbedBuilder()
      .setTitle('🔮 Orbes Oni')
      .setAuthor({ name: target.displayName, iconURL: target.displayAvatarURL() })
      .setDescription(`${target.id === interaction.user.id ? 'Vous avez' : `**${target.displayName}** a`} **${amount}** orbe${amount !== 1 ? 's' : ''} oni.`)
      .setColor(0xFF6600)
      .setFooter({ text: 'Les orbes s\'obtiennent en récupérant des doublons au /bkai • Robonyan' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
