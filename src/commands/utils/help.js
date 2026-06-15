/**
 * /help — Aide et crédits
 * Robonyan | Créé par ᴠʏᴢᴛᴏʀ
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const BOT_NAME = 'Robonyan';
const CREATOR  = 'ᴠʏᴢᴛᴏʀ';

const MODULES = [
  {
    emoji: '🎲',
    name: 'Yo-kai',
    commands: [
      { name: '/bkai', desc: 'Tirer un Yo-kai aléatoire (cooldown 1h30)' },
      { name: '/medallium', desc: 'Voir votre collection de Yo-kai' },
      { name: '/search', desc: 'Rechercher un Yo-kai dans la base de données' },
    ],
  },
  {
    emoji: '🔮',
    name: 'Économie',
    commands: [
      { name: '/orbes', desc: 'Voir votre solde d\'orbes oni' },
    ],
  },
  {
    emoji: '🗳️',
    name: 'Sondages',
    commands: [
      { name: '/sondage créer', desc: 'Créer un sondage interactif (jusqu\'à 8 choix, durée, anonyme)' },
      { name: '/sondage résultats', desc: 'Voir les résultats d\'un sondage' },
    ],
  },
  {
    emoji: '🛡️',
    name: 'Modération',
    commands: [
      { name: '/ban', desc: 'Bannir un membre' },
      { name: '/unban', desc: 'Débannir par ID' },
      { name: '/tempban', desc: 'Bannissement temporaire' },
      { name: '/kick', desc: 'Expulser un membre' },
      { name: '/mute', desc: 'Timeout un membre' },
      { name: '/unmute', desc: 'Retirer un timeout' },
      { name: '/warn', desc: 'Avertir un membre' },
      { name: '/warns', desc: 'Voir les avertissements d\'un membre' },
      { name: '/clearwarns', desc: 'Effacer tous les warns' },
      { name: '/purge', desc: 'Supprimer des messages en masse' },
      { name: '/slowmode', desc: 'Définir le slowmode d\'un salon' },
      { name: '/lock', desc: 'Verrouiller un salon' },
      { name: '/unlock', desc: 'Déverrouiller un salon' },
      { name: '/nickname', desc: 'Modifier le pseudo d\'un membre' },
      { name: '/userinfo', desc: 'Infos sur un membre' },
      { name: '/serverinfo', desc: 'Infos sur le serveur' },
    ],
  },
  {
    emoji: '🐱',
    name: 'Utilitaires',
    commands: [
      { name: '/help', desc: 'Afficher cette aide' },
      { name: '/credits', desc: 'Crédits du bot' },
    ],
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('🐱 Afficher l\'aide de Robonyan')
    .addStringOption(o =>
      o.setName('module')
        .setDescription('Module spécifique (yokai, moderation, sondage, economie)')
        .setRequired(false)
        .addChoices(
          { name: '🎲 Yo-kai', value: 'yokai' },
          { name: '🛡️ Modération', value: 'moderation' },
          { name: '🗳️ Sondages', value: 'sondage' },
          { name: '🔮 Économie', value: 'economie' },
        ),
    ),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const moduleFilter = interaction.options.getString('module');

    // ── Module spécifique ─────────────────────────────────────────────────
    if (moduleFilter) {
      const map = { yokai: 0, economie: 1, sondage: 2, moderation: 3 };
      const mod = MODULES[map[moduleFilter]];
      if (!mod) return interaction.editReply({ content: '❌ Module inconnu.' });

      const embed = new EmbedBuilder()
        .setTitle(`${mod.emoji} Module — ${mod.name}`)
        .setColor(0x5865F2)
        .setDescription(mod.commands.map(c => `\`${c.name}\` — ${c.desc}`).join('\n'))
        .setFooter({ text: `${BOT_NAME} • Créé par ${CREATOR}`, iconURL: client.user.displayAvatarURL() });

      return interaction.editReply({ embeds: [embed] });
    }

    // ── Vue générale ──────────────────────────────────────────────────────
    const embed = new EmbedBuilder()
      .setTitle(`🐱 ${BOT_NAME} — Aide`)
      .setDescription(
        `Bonjour ! Je suis **${BOT_NAME}**, le bot Yo-kai de ce serveur.\n` +
        `Utilisez \`/help module\` pour les détails d'un module.\n\u200B`,
      )
      .setColor(0x5865F2)
      .setThumbnail(client.user.displayAvatarURL())
      .setFooter({ text: `${BOT_NAME} v${client.VERSION} • Créé par ${CREATOR}`, iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    for (const mod of MODULES) {
      embed.addFields({
        name: `${mod.emoji} ${mod.name}`,
        value: mod.commands.map(c => `\`${c.name}\``).join(' '),
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
