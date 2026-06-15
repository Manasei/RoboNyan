/**
 * /bkai — Tirer un Yo-kai au hasard avec image Fandom et Cache Local
 * Robonyan | Créé par ᴠʏᴢᴛᴏʀ
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetch } = require('undici');
const fs = require('fs');
const path = require('path');
const { yokaiList, ALL_CLASSES, getInv, saveInv, addOrbes } = require('../../utils/helpers');

const IMAGE_DIR = path.join(__dirname, '..', '..', '..', 'data', 'images');

if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

const COOLDOWN_MS = 90 * 60 * 1000;

const CLASS_POINTS = {
  E: 1, D: 2, C: 4, B: 8, A: 15, S: 30,
  treasureS: 20, SpecialS: 50, LegendaryS: 100,
  DivinityS: 200, Boss: 150, Shiny: 500,
};
const CLASS_COLORS = {
  E: 0x808080, D: 0x00CC00, C: 0x0099FF, B: 0xFF6600,
  A: 0xFF0000, S: 0xFFD700, treasureS: 0xC0C0C0,
  SpecialS: 0xAA00FF, LegendaryS: 0xFF4400,
  DivinityS: 0x00FFFF, Boss: 0x990000, Shiny: 0xFFFF00,
};
const CLASS_EMOJI = {
  E: '⚪', D: '🟢', C: '🔵', B: '🟠', A: '🔴', S: '⭐',
  treasureS: '🪙', SpecialS: '💜', LegendaryS: '🔥',
  DivinityS: '💠', Boss: '💀', Shiny: '✨',
};
const CLASS_WEIGHTS = {
  E: 35, D: 25, C: 18, B: 10, A: 6, S: 3,
  treasureS: 1, SpecialS: 0.8, LegendaryS: 0.6,
  DivinityS: 0.3, Boss: 0.2, Shiny: 0.1,
};

async function fetchFandomData(yokaiName) {
  try {
    const formattedName = yokaiName.replace(/ /g, '_');
    const wikiUrl = `https://yokaiwatch.fandom.com/fr/wiki/${encodeURIComponent(formattedName)}`;
    
    const localFileName = `${formattedName}.png`;
    const localFilePath = path.join(IMAGE_DIR, localFileName);

    if (fs.existsSync(localFilePath)) {
      return { 
        wikiUrl, 
        imageUrl: `attachment://${localFileName}`, 
        localFile: localFilePath 
      };
    }

    const apiUrl = `https://yokaiwatch.fandom.com/fr/api.php?action=query&titles=${encodeURIComponent(formattedName)}&prop=pageimages&format=json&pithumbsize=500`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) return { wikiUrl, imageUrl: null, localFile: null };

    const data = await response.json();
    const pages = data.query?.pages;
    if (!pages) return { wikiUrl, imageUrl: null, localFile: null };
    
    const pageId = Object.keys(pages)[0];
    if (pageId === '-1') return { wikiUrl, imageUrl: null, localFile: null };

    const remoteImageUrl = pages[pageId].thumbnail?.source || null;

    if (remoteImageUrl) {
      const imgResponse = await fetch(remoteImageUrl);
      if (imgResponse.ok) {
        const buffer = Buffer.from(await imgResponse.arrayBuffer());
        fs.writeFileSync(localFilePath, buffer);
        
        return { 
          wikiUrl, 
          imageUrl: `attachment://${localFileName}`, 
          localFile: localFilePath 
        };
      }
    }

    return { wikiUrl, imageUrl: null, localFile: null };
  } catch (err) {
    console.error(`Erreur Cache/API Fandom pour ${yokaiName}:`, err);
    return { wikiUrl: null, imageUrl: null, localFile: null };
  }
}

function weightedRandomClass() {
  const total = Object.values(CLASS_WEIGHTS).reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (const [cls, w] of Object.entries(CLASS_WEIGHTS)) {
    rand -= w;
    if (rand <= 0) return cls;
  }
  return 'E';
}

function rollYokai() {
  let cls = weightedRandomClass();
  while (!yokaiList[cls]?.yokai_list?.length) cls = weightedRandomClass();
  const list = yokaiList[cls].yokai_list;
  const yokai = list[Math.floor(Math.random() * list.length)];
  return { yokai, cls };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bkai')
    .setDescription('🎲 Tirer un Yo-kai au hasard ! (cooldown 1h30)')
    .setDMPermission(false),

  async execute(interaction, client) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const now    = Date.now();

    const lastUsed  = client.cooldowns.get(`bkai_${userId}`) || 0;
    const remaining = COOLDOWN_MS - (now - lastUsed);
    if (remaining > 0) {
      const mins = Math.ceil(remaining / 60000);
      const secs = Math.ceil((remaining % 60000) / 1000);
      const embed = new EmbedBuilder()
        .setTitle('⏳ Cooldown actif')
        .setDescription(`Attends encore **${mins > 0 ? `${mins}m ` : ''}${secs}s** avant de relancer !`)
        .setColor(0xFEE75C);
      return interaction.editReply({ embeds: [embed] });
    }

    const { yokai, cls } = rollYokai();
    const classData = yokaiList[cls];
    const className = classData?.class_name || cls;
    const color     = CLASS_COLORS[cls]     || 0x5865F2;
    const emoji     = CLASS_EMOJI[cls]      || '🎲';
    const points    = CLASS_POINTS[cls]     || 1;

    const { wikiUrl, imageUrl, localFile } = await fetchFandomData(yokai);

    const inv   = getInv(userId);
    const isNew = !inv[yokai];
    let orbesGained = 0;

    if (isNew) {
      inv[yokai] = { class: cls, count: 1 };
      saveInv(userId, inv);
    } else {
      inv[yokai].count = (inv[yokai].count || 1) + 1;
      saveInv(userId, inv);
      orbesGained = points;
      addOrbes(userId, orbesGained);
    }

    client.cooldowns.set(`bkai_${userId}`, now);

    const embed = new EmbedBuilder()
      .setTitle(`${emoji} ${isNew ? '✨ Nouveau Yo-kai !' : '🔁 Doublon !'}`)
      .setColor(color)
      .setTimestamp()
      .setFooter({ text: 'Robonyan • Créé par ᴠʏᴢᴛᴏʀ', iconURL: client.user.displayAvatarURL() });

    if (wikiUrl) embed.setURL(wikiUrl);

    // ✅ GROS TITRE EN BAS
    embed.setDescription(`# ${yokai}`);

    const files = [];
    if (imageUrl && localFile) {
      const fileName = path.basename(localFile);
      embed.setImage(`attachment://${fileName}`);
      files.push({ attachment: localFile, name: fileName });
    }

    embed.addFields(
      { name: '📊 Classe',  value: `${emoji} **${className}**`, inline: true },
      { name: '💎 Points',  value: `**${points}** pts`,          inline: true },
    );

    embed.addFields({
      name: isNew ? '📦 Statut' : '🔮 Orbes gagnés',
      value: isNew
        ? '✅ Ajouté à ton médaillium !'
        : `+**${orbesGained}** orbes oni\n*(Total possédés : **${inv[yokai].count}**)*`,
      inline: false,
    });

    if (wikiUrl) {
      embed.addFields({ name: '🔗 Wiki', value: `[Voir la fiche sur le Wiki FR](${wikiUrl})`, inline: false });
    }

    await interaction.editReply({ embeds: [embed], files: files });
  },
};
