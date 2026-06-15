/**
 * /search — Rechercher un Yo-kai
 * Robonyan | Créé par ᴠʏᴢᴛᴏʀ
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { yokaiList, ALL_CLASSES, smartMatch, getInv, errorEmbed } = require('../../utils/helpers');

// Données enrichies wiki
const YOKAI_DATA_FILE = path.join(__dirname, '..', '..', '..', 'data', 'yokai_data.json');
let yokaiData = {};
if (fs.existsSync(YOKAI_DATA_FILE)) {
  try { yokaiData = JSON.parse(fs.readFileSync(YOKAI_DATA_FILE, 'utf-8')); }
  catch { yokaiData = {}; }
}

const CLASS_EMOJI = {
  E: '⚪', D: '🟢', C: '🔵', B: '🟠', A: '🔴', S: '⭐',
  treasureS: '🪙', SpecialS: '💜', LegendaryS: '🔥', DivinityS: '💠', Boss: '💀', Shiny: '✨',
};

const CLASS_POINTS = {
  E: 1, D: 2, C: 4, B: 8, A: 15, S: 30,
  treasureS: 20, SpecialS: 50, LegendaryS: 100, DivinityS: 200, Boss: 150, Shiny: 500,
};

// Build full list for autocomplete
const FULL_LIST = [];
for (const cls of ALL_CLASSES) {
  for (const y of (yokaiList[cls]?.yokai_list || [])) {
    FULL_LIST.push({ name: y, cls });
  }
}

// Fonction pour nettoyer les données
function cleanText(text) {
  if (!text) return null;
  return String(text).replace(/{{|}}/g, '').trim();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('🔍 Rechercher un Yo-kai dans la base de données')
    .addStringOption(o =>
      o.setName('nom').setDescription('Nom du Yo-kai').setRequired(true).setAutocomplete(true)
    )
    .setDMPermission(false),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const results = FULL_LIST
      .filter(y => y.name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map(y => ({ name: y.name, value: y.name }));
    await interaction.respond(results);
  },

  async execute(interaction, client) {
    await interaction.deferReply();
    const query = interaction.options.getString('nom');

    let found = FULL_LIST.find(y => y.name.toLowerCase() === query.toLowerCase());
    if (!found) {
      const match = smartMatch(query, FULL_LIST.map(y => y.name));
      if (match) found = FULL_LIST.find(y => y.name === match);
    }

    if (!found) {
      return interaction.editReply({ embeds: [errorEmbed('Yo-kai introuvable', `Aucun Yo-kai nommé **${query}** trouvé.`)] });
    }

    const { name, cls } = found;
    const classData  = yokaiList[cls];
    const emoji      = CLASS_EMOJI[cls]  || '🎲';
    const points     = CLASS_POINTS[cls] || 0;
    const color      = parseInt(classData?.color?.replace('#', ''), 16) || 0x5865F2;

    // Données wiki (nettoyées)
    const wiki      = yokaiData[name] || {};
    const imageUrl  = wiki.image   || null;
    const wikiRank  = cleanText(wiki.rank);
    const wikiTribe = cleanText(wiki.tribe);
    const wikiUrl   = wiki.wikiUrl || null;

    // Inventaire
    const inv   = getInv(interaction.user.id);
    const hasIt = !!inv[name];
    const count = inv[name]?.count || 0;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setImage(imageUrl)
      .setFooter({ text: 'Robonyan • Créé par ᴠʏᴢᴛᴏʀ' })
      .setTimestamp();

    if (wikiUrl) embed.setURL(wikiUrl);

    // ✅ GROS TITRE
    embed.setDescription(`# ${name}`);

    // Section Infos
    let infoText = `📊 **Classe**\n${emoji} \`${classData?.class_name || cls}\`\n\n`;
    infoText += `💎 **Points**\n\`${points} pts\`\n\n`;
    infoText += `🏅 **Rang**\n\`${wikiRank || cls}\``;

    // Tribu si disponible
    if (wikiTribe) {
      embed.addFields({
        name: '⚔️ **Tribu**',
        value: `\`${wikiTribe}\``,
        inline: false,
      });
    }

    // Collection
    const collectionEmoji = hasIt ? '✅' : '❌';
    const collectionText = hasIt 
      ? `\`Ajouté à ta collection !\` (${count}x)`
      : `\`Non possédé\``;

    embed.addFields({
      name: '📦 **Statut**',
      value: `${collectionEmoji} ${collectionText}`,
      inline: false,
    });

    // Wiki
    if (wikiUrl) {
      embed.addFields({
        name: '🔗 **Wiki**',
        value: `[Voir la fiche sur le Wiki FR](${wikiUrl})`,
        inline: false,
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
