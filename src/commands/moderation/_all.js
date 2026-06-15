/**
 * /ban, /unban, /tempban, /kick, /mute, /unmute, /warn, /warns, /clearwarns
 * /purge, /slowmode, /lock, /unlock, /nickname, /userinfo, /serverinfo
 * Robonyan | Créé par ᴠʏᴢᴛᴏʀ
 */

const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require('discord.js');
const { modEmbed, errorEmbed, parseDuration, formatDuration } = require('../../utils/helpers');

// Helper DM
async function tryDM(member, embed) {
  try { await member.send({ embeds: [embed] }); return true; }
  catch { return false; }
}

// ─────────────────────────────────────────────────────────────────────────────
//  BAN
// ─────────────────────────────────────────────────────────────────────────────

const ban = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🔨 Bannir un membre du serveur')
    .addUserOption(o => o.setName('membre').setDescription('Membre à bannir').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison du bannissement').setRequired(false))
    .addIntegerOption(o => o.setName('supprimer_messages').setDescription('Jours de messages à supprimer (0-7)').setMinValue(0).setMaxValue(7).setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    const member = interaction.options.getMember('membre');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';
    const delDays = interaction.options.getInteger('supprimer_messages') || 0;

    if (!member) return interaction.editReply({ embeds: [errorEmbed('Membre introuvable', 'Ce membre n\'est pas sur le serveur.')] });
    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.editReply({ embeds: [errorEmbed('Permission refusée', 'Vous ne pouvez pas bannir un membre avec un rôle égal ou supérieur.')] });
    }

    const dmEmbed = new EmbedBuilder().setTitle('🔨 Vous avez été banni').setDescription(`Vous avez été banni du serveur **${interaction.guild.name}**.`).setColor(0xED4245).addFields({ name: '📋 Raison', value: raison });
    await tryDM(member, dmEmbed);

    await member.ban({ reason: `${raison} | Modérateur: ${interaction.user.tag}`, deleteMessageDays: delDays });

    const embed = modEmbed({ title: '🔨 Membre banni', description: `${member} a été banni.`, color: 0xED4245, moderator: interaction.member, target: member, reason: raison, fields: [{ name: '👤 Utilisateur', value: `${member.user.tag} (\`${member.id}\`)`, inline: true }] });
    await interaction.editReply({ embeds: [embed] });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  UNBAN
// ─────────────────────────────────────────────────────────────────────────────

const unban = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('🔓 Débannir un utilisateur par son ID')
    .addStringOption(o => o.setName('user_id').setDescription('ID Discord de l\'utilisateur').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const uid = interaction.options.getString('user_id');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';

    let banEntry;
    try { banEntry = await interaction.guild.bans.fetch(uid); }
    catch { return interaction.editReply({ embeds: [errorEmbed('Non banni', 'Cet utilisateur n\'est pas banni.')] }); }

    await interaction.guild.members.unban(uid, `${raison} | Modérateur: ${interaction.user.tag}`);
    const embed = modEmbed({ title: '🔓 Membre débanni', description: `**${banEntry.user.tag}** (\`${uid}\`) a été débanni.`, color: 0x57F287, moderator: interaction.member, reason: raison });
    await interaction.editReply({ embeds: [embed] });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  TEMPBAN
// ─────────────────────────────────────────────────────────────────────────────

const tempban = {
  data: new SlashCommandBuilder()
    .setName('tempban')
    .setDescription('⏳ Bannir temporairement un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre à bannir').setRequired(true))
    .addStringOption(o => o.setName('durée').setDescription('Durée (ex: 10m, 2h, 1d, 1w)').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    const member = interaction.options.getMember('membre');
    const duréeStr = interaction.options.getString('durée');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';

    if (!member) return interaction.editReply({ embeds: [errorEmbed('Membre introuvable', 'Ce membre n\'est pas sur le serveur.')] });
    const ms = parseDuration(duréeStr);
    if (!ms) return interaction.editReply({ embeds: [errorEmbed('Durée invalide', 'Exemples: `30s`, `10m`, `2h`, `1d`, `1w`')] });
    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.editReply({ embeds: [errorEmbed('Permission refusée', 'Vous ne pouvez pas bannir ce membre.')] });
    }

    const readable = formatDuration(ms);
    const dmEmbed = new EmbedBuilder().setTitle('⏳ Bannissement temporaire').setDescription(`Vous avez été banni temporairement de **${interaction.guild.name}** pour **${readable}**.`).setColor(0xFEE75C).addFields({ name: '📋 Raison', value: raison });
    await tryDM(member, dmEmbed);

    await member.ban({ reason: `[TEMPBAN ${readable}] ${raison} | Modérateur: ${interaction.user.tag}` });
    const embed = modEmbed({ title: '⏳ Bannissement temporaire', description: `${member} banni pour **${readable}**.`, color: 0xFEE75C, moderator: interaction.member, target: member, reason: raison, fields: [{ name: '⏱️ Durée', value: readable, inline: true }] });
    await interaction.editReply({ embeds: [embed] });

    setTimeout(async () => {
      try { await interaction.guild.members.unban(member.id, 'Fin du bannissement temporaire'); } catch { /* déjà débanni */ }
    }, ms);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  KICK
// ─────────────────────────────────────────────────────────────────────────────

const kick = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('👢 Expulser un membre du serveur')
    .addUserOption(o => o.setName('membre').setDescription('Membre à expulser').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const member = interaction.options.getMember('membre');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';

    if (!member) return interaction.editReply({ embeds: [errorEmbed('Membre introuvable', 'Ce membre n\'est pas sur le serveur.')] });
    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.editReply({ embeds: [errorEmbed('Permission refusée', 'Vous ne pouvez pas expulser ce membre.')] });
    }

    const dmEmbed = new EmbedBuilder().setTitle('👢 Vous avez été expulsé').setDescription(`Vous avez été expulsé de **${interaction.guild.name}**.`).setColor(0xFEE75C).addFields({ name: '📋 Raison', value: raison });
    await tryDM(member, dmEmbed);

    await member.kick(`${raison} | Modérateur: ${interaction.user.tag}`);
    const embed = modEmbed({ title: '👢 Membre expulsé', description: `${member} a été expulsé.`, color: 0xFEE75C, moderator: interaction.member, target: member, reason: raison });
    await interaction.editReply({ embeds: [embed] });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  MUTE (timeout)
// ─────────────────────────────────────────────────────────────────────────────

const mute = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('🔇 Mettre en timeout un membre (max 28j)')
    .addUserOption(o => o.setName('membre').setDescription('Membre à muter').setRequired(true))
    .addStringOption(o => o.setName('durée').setDescription('Durée (ex: 10m, 2h, 1d)').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const member = interaction.options.getMember('membre');
    const duréeStr = interaction.options.getString('durée');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';

    if (!member) return interaction.editReply({ embeds: [errorEmbed('Membre introuvable', 'Ce membre n\'est pas sur le serveur.')] });
    const ms = parseDuration(duréeStr);
    if (!ms) return interaction.editReply({ embeds: [errorEmbed('Durée invalide', 'Exemples: `30s`, `10m`, `2h`, `1d`')] });
    if (ms > 28 * 86400000) return interaction.editReply({ embeds: [errorEmbed('Trop long', 'La durée maximale d\'un timeout est **28 jours**.')] });
    if (member.roles.highest.position >= interaction.member.roles.highest.position) {
      return interaction.editReply({ embeds: [errorEmbed('Permission refusée', 'Vous ne pouvez pas muter ce membre.')] });
    }

    const readable = formatDuration(ms);
    await member.timeout(ms, `${raison} | Modérateur: ${interaction.user.tag}`);

    const dmEmbed = new EmbedBuilder().setTitle('🔇 Vous avez été mis en timeout').setDescription(`Timeout sur **${interaction.guild.name}** pour **${readable}**.`).setColor(0xFEE75C).addFields({ name: '📋 Raison', value: raison });
    await tryDM(member, dmEmbed);

    const embed = modEmbed({ title: '🔇 Membre mis en timeout', description: `${member} a été mis en timeout pour **${readable}**.`, color: 0xFEE75C, moderator: interaction.member, target: member, reason: raison, fields: [{ name: '⏱️ Durée', value: readable, inline: true }] });
    await interaction.editReply({ embeds: [embed] });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  UNMUTE
// ─────────────────────────────────────────────────────────────────────────────

const unmute = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('🔊 Retirer le timeout d\'un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre à démuter').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const member = interaction.options.getMember('membre');
    const raison = interaction.options.getString('raison') || 'Aucune raison fournie';

    if (!member) return interaction.editReply({ embeds: [errorEmbed('Membre introuvable', 'Ce membre n\'est pas sur le serveur.')] });
    if (!member.isCommunicationDisabled()) return interaction.editReply({ embeds: [errorEmbed('Pas en timeout', 'Ce membre n\'est pas en timeout.')] });

    await member.timeout(null, `${raison} | Modérateur: ${interaction.user.tag}`);
    const embed = modEmbed({ title: '🔊 Timeout retiré', description: `Le timeout de ${member} a été levé.`, color: 0x57F287, moderator: interaction.member, target: member, reason: raison });
    await interaction.editReply({ embeds: [embed] });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  WARN
// ─────────────────────────────────────────────────────────────────────────────

const warn = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('⚠️ Avertir un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre à avertir').setRequired(true))
    .addStringOption(o => o.setName('raison').setDescription('Raison de l\'avertissement').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    const member = interaction.options.getMember('membre');
    const raison = interaction.options.getString('raison');

    if (!member) return interaction.editReply({ embeds: [errorEmbed('Membre introuvable', 'Ce membre n\'est pas sur le serveur.')] });

    const guildId = interaction.guildId;
    if (!client.warnings.has(guildId)) client.warnings.set(guildId, new Map());
    const gWarn = client.warnings.get(guildId);
    if (!gWarn.has(member.id)) gWarn.set(member.id, []);
    gWarn.get(member.id).push({ raison, modId: interaction.user.id, modTag: interaction.user.tag, at: Date.now() });
    const count = gWarn.get(member.id).length;

    const dmEmbed = new EmbedBuilder().setTitle('⚠️ Avertissement reçu').setDescription(`Vous avez été averti sur **${interaction.guild.name}**. (Avertissement n°${count})`).setColor(0xFEE75C).addFields({ name: '📋 Raison', value: raison });
    await tryDM(member, dmEmbed);

    const embed = modEmbed({ title: '⚠️ Avertissement', description: `${member} a reçu un avertissement. Total : **${count}**`, color: 0xFEE75C, moderator: interaction.member, target: member, reason: raison, fields: [{ name: '🔢 Total warns', value: String(count), inline: true }] });
    await interaction.editReply({ embeds: [embed] });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  WARNS
// ─────────────────────────────────────────────────────────────────────────────

const warns = {
  data: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('📋 Voir les avertissements d\'un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    const member = interaction.options.getMember('membre');
    if (!member) return interaction.editReply({ embeds: [errorEmbed('Membre introuvable', 'Ce membre n\'est pas sur le serveur.')] });

    const list = client.warnings.get(interaction.guildId)?.get(member.id) || [];

    if (!list.length) {
      const embed = new EmbedBuilder().setTitle(`📋 Avertissements de ${member.displayName}`).setDescription('✅ Aucun avertissement.').setColor(0x57F287).setThumbnail(member.displayAvatarURL());
      return interaction.editReply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder().setTitle(`📋 Avertissements de ${member.displayName}`).setDescription(`**${list.length}** avertissement(s)`).setColor(0xFEE75C).setThumbnail(member.displayAvatarURL()).setFooter({ text: 'Robonyan • Modération' });
    for (const [i, w] of list.entries()) {
      embed.addFields({ name: `Warn #${i + 1}`, value: `**Raison :** ${w.raison}\n**Par :** ${w.modTag}`, inline: false });
    }
    await interaction.editReply({ embeds: [embed] });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  CLEARWARNS
// ─────────────────────────────────────────────────────────────────────────────

const clearwarns = {
  data: new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('🗑️ Effacer tous les avertissements d\'un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });
    const member = interaction.options.getMember('membre');
    if (!member) return interaction.editReply({ embeds: [errorEmbed('Membre introuvable', 'Ce membre n\'est pas sur le serveur.')] });

    client.warnings.get(interaction.guildId)?.delete(member.id);
    const embed = modEmbed({ title: '🗑️ Avertissements supprimés', description: `Tous les avertissements de ${member} ont été effacés.`, color: 0x57F287, moderator: interaction.member, target: member });
    await interaction.editReply({ embeds: [embed] });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  PURGE
// ─────────────────────────────────────────────────────────────────────────────

const purge = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('🧹 Supprimer des messages en masse (1-100)')
    .addIntegerOption(o => o.setName('nombre').setDescription('Nombre de messages').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName('membre').setDescription('Filtrer par membre (optionnel)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const nombre = interaction.options.getInteger('nombre');
    const member = interaction.options.getUser('membre');

    let messages = await interaction.channel.messages.fetch({ limit: nombre });
    if (member) messages = messages.filter(m => m.author.id === member.id);

    // bulk delete only works on messages < 14 days old
    const deleted = await interaction.channel.bulkDelete(messages, true);

    const embed = new EmbedBuilder()
      .setTitle('🧹 Messages supprimés')
      .setDescription(`**${deleted.size}** message(s) supprimé(s)${member ? ` de ${member}` : ''}.`)
      .setColor(0x5865F2)
      .setFooter({ text: `Par ${interaction.user.displayName} • Robonyan`, iconURL: interaction.user.displayAvatarURL() });
    await interaction.editReply({ embeds: [embed] });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  SLOWMODE
// ─────────────────────────────────────────────────────────────────────────────

const slowmode = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('🐢 Définir le slowmode d\'un salon (0s pour désactiver, max 6h)')
    .addStringOption(o => o.setName('durée').setDescription('Durée (ex: 0s, 5s, 1m, 6h)').setRequired(true))
    .addChannelOption(o => o.setName('salon').setDescription('Salon cible (défaut: actuel)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const duréeStr = interaction.options.getString('durée');
    const channel  = interaction.options.getChannel('salon') || interaction.channel;
    const ms = parseDuration(duréeStr);
    if (ms === null) return interaction.editReply({ embeds: [errorEmbed('Durée invalide', 'Exemples: `0s`, `5s`, `1m`, `6h`')] });
    const seconds = ms / 1000;
    if (seconds > 21600) return interaction.editReply({ embeds: [errorEmbed('Trop long', 'Le slowmode maximum est **6 heures**.')] });

    await channel.setRateLimitPerUser(seconds);
    const readable = seconds === 0 ? 'désactivé' : formatDuration(ms);
    const embed = new EmbedBuilder().setTitle('🐢 Slowmode mis à jour').setDescription(`Slowmode de ${channel} : **${readable}**`).setColor(0x5865F2).setFooter({ text: `Par ${interaction.user.displayName} • Robonyan`, iconURL: interaction.user.displayAvatarURL() });
    await interaction.editReply({ embeds: [embed] });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  LOCK / UNLOCK
// ─────────────────────────────────────────────────────────────────────────────

const lock = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('🔒 Verrouiller un salon')
    .addChannelOption(o => o.setName('salon').setDescription('Salon à verrouiller (défaut: actuel)').setRequired(false))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const channel = interaction.options.getChannel('salon') || interaction.channel;
    const raison  = interaction.options.getString('raison') || 'Aucune raison fournie';

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }, { reason: raison });
    const embed = new EmbedBuilder().setTitle('🔒 Salon verrouillé').setDescription(`${channel} est maintenant verrouillé.\n**Raison :** ${raison}`).setColor(0xED4245).setFooter({ text: `Par ${interaction.user.displayName} • Robonyan`, iconURL: interaction.user.displayAvatarURL() });
    await channel.send({ embeds: [embed] });
    await interaction.editReply({ content: `🔒 ${channel} verrouillé.` });
  },
};

const unlock = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('🔓 Déverrouiller un salon')
    .addChannelOption(o => o.setName('salon').setDescription('Salon à déverrouiller (défaut: actuel)').setRequired(false))
    .addStringOption(o => o.setName('raison').setDescription('Raison').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const channel = interaction.options.getChannel('salon') || interaction.channel;
    const raison  = interaction.options.getString('raison') || 'Aucune raison fournie';

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null }, { reason: raison });
    const embed = new EmbedBuilder().setTitle('🔓 Salon déverrouillé').setDescription(`${channel} est de nouveau ouvert.\n**Raison :** ${raison}`).setColor(0x57F287).setFooter({ text: `Par ${interaction.user.displayName} • Robonyan`, iconURL: interaction.user.displayAvatarURL() });
    await channel.send({ embeds: [embed] });
    await interaction.editReply({ content: `🔓 ${channel} déverrouillé.` });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  NICKNAME
// ─────────────────────────────────────────────────────────────────────────────

const nickname = {
  data: new SlashCommandBuilder()
    .setName('nickname')
    .setDescription('✏️ Changer le pseudo d\'un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre').setRequired(true))
    .addStringOption(o => o.setName('pseudo').setDescription('Nouveau pseudo (vide pour réinitialiser)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const member = interaction.options.getMember('membre');
    const newNick = interaction.options.getString('pseudo') || null;
    if (!member) return interaction.editReply({ embeds: [errorEmbed('Membre introuvable', 'Ce membre n\'est pas sur le serveur.')] });

    const old = member.displayName;
    await member.setNickname(newNick);
    const embed = new EmbedBuilder().setTitle('✏️ Pseudo modifié').setDescription(`Pseudo de ${member} mis à jour.`).addFields({ name: 'Avant', value: old, inline: true }, { name: 'Après', value: newNick || member.user.username, inline: true }).setColor(0x5865F2).setFooter({ text: `Par ${interaction.user.displayName} • Robonyan`, iconURL: interaction.user.displayAvatarURL() });
    await interaction.editReply({ embeds: [embed] });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  USERINFO
// ─────────────────────────────────────────────────────────────────────────────

const userinfo = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('🔍 Infos sur un membre')
    .addUserOption(o => o.setName('membre').setDescription('Membre (défaut: vous)').setRequired(false))
    .setDMPermission(false),

  async execute(interaction, client) {
    await interaction.deferReply();
    const member = interaction.options.getMember('membre') || interaction.member;
    const user = member.user;

    const roles = member.roles.cache
      .filter(r => r.id !== interaction.guildId)
      .sort((a, b) => b.position - a.position)
      .map(r => r.toString());

    const warns = client.warnings.get(interaction.guildId)?.get(member.id)?.length || 0;

    const embed = new EmbedBuilder()
      .setTitle(`🔍 ${member.displayName}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .setColor(member.displayHexColor || 0x5865F2)
      .addFields(
        { name: '👤 Nom', value: user.tag, inline: true },
        { name: '🆔 ID', value: user.id, inline: true },
        { name: '🤖 Bot', value: user.bot ? 'Oui' : 'Non', inline: true },
        { name: '📅 Compte créé', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '📥 A rejoint', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: '⚠️ Warns', value: String(warns), inline: true },
        { name: `🎭 Rôles (${roles.length})`, value: roles.slice(0, 10).join(' ') || 'Aucun', inline: false },
      )
      .setFooter({ text: 'Robonyan • Modération' })
      .setTimestamp();

    if (member.isCommunicationDisabled()) {
      embed.addFields({ name: '🔇 Timeout jusqu\'au', value: `<t:${Math.floor(member.communicationDisabledUntilTimestamp / 1000)}:R>`, inline: false });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  SERVERINFO
// ─────────────────────────────────────────────────────────────────────────────

const serverinfo = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('🏠 Informations sur le serveur')
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.deferReply();
    const g = interaction.guild;
    await g.fetch();

    const embed = new EmbedBuilder()
      .setTitle(`🏠 ${g.name}`)
      .setThumbnail(g.iconURL())
      .setColor(0x5865F2)
      .addFields(
        { name: '🆔 ID', value: g.id, inline: true },
        { name: '👑 Propriétaire', value: `<@${g.ownerId}>`, inline: true },
        { name: '📅 Créé le', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '👥 Membres', value: String(g.memberCount), inline: true },
        { name: '💬 Salons', value: String(g.channels.cache.size), inline: true },
        { name: '🎭 Rôles', value: String(g.roles.cache.size), inline: true },
        { name: '🚀 Boosts', value: String(g.premiumSubscriptionCount || 0), inline: true },
        { name: '📊 Niveau boost', value: String(g.premiumTier), inline: true },
      )
      .setFooter({ text: 'Robonyan • Modération' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

// ─── Exports (un fichier par commande grâce au handler multi-commandes) ──────
// On exporte toutes les commandes depuis ce fichier central.
// Le handler les trouvera une par une.
module.exports = { ban, unban, tempban, kick, mute, unmute, warn, warns, clearwarns, purge, slowmode, lock, unlock, nickname, userinfo, serverinfo };
