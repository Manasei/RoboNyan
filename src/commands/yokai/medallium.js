/**
 * /medallium — Voir sa collection de Yo-kai
 * Robonyan | Créé par ᴠʏᴢᴛᴏʀ
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { getInv, yokaiList, ALL_CLASSES } = require('../../utils/helpers');

const CLASS_EMOJI = {
  E: '⚪', D: '🟢', C: '🔵', B: '🟠', A: '🔴', S: '⭐',
  treasureS: '🪙', SpecialS: '💜', LegendaryS: '🔥',
  DivinityS: '💠', Boss: '💀', Shiny: '✨',
};
const CLASS_POINTS = {
  E: 1, D: 2, C: 4, B: 8, A: 15, S: 30,
  treasureS: 20, SpecialS: 50, LegendaryS: 100, DivinityS: 200, Boss: 150, Shiny: 500,
};

const CLASS_COLOR = {
  E: 0xAAAAAA, D: 0x00AA00, C: 0x0000FF, B: 0xFF8800, A: 0xFF0000, S: 0xFFDD00,
  treasureS: 0xFFAA00, SpecialS: 0xAA00FF, LegendaryS: 0xFF0000, DivinityS: 0x00FFFF,
  Boss: 0x660000, Shiny: 0xFFFFFF,
};

function buildBar(current, total, size = 10) {
  if (total === 0) return '░'.repeat(size);
  const filled = Math.round((current / total) * size);
  return '█'.repeat(filled) + '░'.repeat(size - filled);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('medallium')
    .setDescription('📖 Voir votre médaillium (collection de Yo-kai)')
    .addUserOption(o => o.setName('joueur').setDescription('Joueur à consulter').setRequired(false))
    .setDMPermission(false),

  async execute(interaction, client) {
    await interaction.deferReply();

    const target = interaction.options.getUser('joueur') || interaction.user;
    const inv    = getInv(target.id);
    const owned  = new Set(Object.keys(inv));

    let totalOwned = 0, totalAll = 0, totalPoints = 0;

    const byClass = {};
    for (const cls of ALL_CLASSES) {
      const list = yokaiList[cls]?.yokai_list || [];
      const o    = list.filter(y => owned.has(y)).length;
      byClass[cls] = { owned: o, total: list.length };
      totalOwned  += o;
      totalAll    += list.length;
      totalPoints += o * (CLASS_POINTS[cls] || 0);
    }

    const pct = totalAll > 0 ? ((totalOwned / totalAll) * 100).toFixed(1) : '0.0';

    // ─── EMBED PRINCIPAL ────────────────────────────────────────────
    const mainEmbed = new EmbedBuilder()
      .setTitle(`📖 Médaillium de ${target.displayName}`)
      .setThumbnail(target.displayAvatarURL())
      .setColor(0x5865F2)
      .setDescription(
        `**${totalOwned} / ${totalAll}** Yo-kai collectés (**${pct}%**)\n` +
        `**${totalPoints}** points au total\n\n` +
        `Clique sur une catégorie pour voir tes Yo-kai!`
      )
      .setFooter({ text: 'Robonyan • Créé par ᴠʏᴢᴛᴏʀ' })
      .setTimestamp();

    for (const cls of ALL_CLASSES) {
      const { owned: o, total } = byClass[cls];
      if (total === 0) continue;
      const emoji     = CLASS_EMOJI[cls] || '🎲';
      const className = yokaiList[cls]?.class_name || cls;
      const bar       = buildBar(o, total);
      mainEmbed.addFields({
        name:   `${emoji} ${className}`,
        value:  `\`${bar}\` **${o}/${total}**`,
        inline: true,
      });
    }

    // ─── DROPDOWN MENU ──────────────────────────────────────────────
    const selectOptions = [
      {
        label: '🌍 Tout afficher',
        value: 'ALL',
        emoji: '🌍',
        description: 'Affiche tous tes Yo-kai',
      },
      ...ALL_CLASSES
        .filter(cls => byClass[cls].total > 0)
        .map(cls => {
          const emoji = CLASS_EMOJI[cls] || '🎲';
          const className = yokaiList[cls]?.class_name || cls;
          const { owned: o, total } = byClass[cls];
          return {
            label: `${className}`,
            value: cls,
            emoji: emoji,
            description: `${o}/${total} Yo-kai possédés`,
          };
        }),
    ];

    const dropdown = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`medallium_${target.id}`)
        .setPlaceholder('Choisissez une catégorie...')
        .addOptions(selectOptions)
    );

    const reply = await interaction.editReply({
      embeds: [mainEmbed],
      components: [dropdown],
    });

    // ─── INTERACTION COLLECTOR ──────────────────────────────────────
    const filter = (i) => i.customId === `medallium_${target.id}` && i.user.id === interaction.user.id;
    const collector = reply.createMessageComponentCollector({ filter, time: 300000 }); // 5 min

    collector.on('collect', async (i) => {
      const selectedValue = i.values[0];

      let categoryEmbed;

      if (selectedValue === 'ALL') {
        // ─── AFFICHER TOUS LES YO-KAI ──────────────────────────────
        const allOwned = Array.from(owned);
        const embeds = [];

        // Créer un embed par catégorie
        for (const cls of ALL_CLASSES) {
          const list = yokaiList[cls]?.yokai_list || [];
          const ownedInClass = list.filter(y => owned.has(y));

          if (ownedInClass.length === 0) continue;

          const embed = new EmbedBuilder()
            .setTitle(`${CLASS_EMOJI[cls]} ${yokaiList[cls]?.class_name || cls}`)
            .setColor(CLASS_COLOR[cls] || 0x5865F2)
            .setDescription(
              `**${ownedInClass.length}/${list.length} Yo-kai:**\n\n${ownedInClass.map(y => `✅ ${y}`).join('\n')}`
            )
            .setFooter({ text: 'Robonyan • Créé par ᴠʏᴢᴛᴏʀ' });

          embeds.push(embed);
        }

        // Si trop d'embeds, on affiche seulement les 10 premiers
        if (embeds.length > 0) {
          await i.update({
            embeds: embeds.slice(0, 10),
            components: [dropdown],
          });
        } else {
          categoryEmbed = new EmbedBuilder()
            .setTitle('🌍 Tous les Yo-kai')
            .setColor(0x5865F2)
            .setDescription('**Aucun Yo-kai possédé!**')
            .setThumbnail(target.displayAvatarURL())
            .setFooter({ text: 'Robonyan • Créé par ᴠʏᴢᴛᴏʀ' });

          await i.update({ embeds: [categoryEmbed], components: [dropdown] });
        }
      } else {
        // ─── AFFICHER UNE CATÉGORIE SPÉCIFIQUE ─────────────────────
        const list = yokaiList[selectedValue]?.yokai_list || [];
        const ownedInClass = list.filter(y => owned.has(y));

        categoryEmbed = new EmbedBuilder()
          .setTitle(`${CLASS_EMOJI[selectedValue]} ${yokaiList[selectedValue]?.class_name || selectedValue}`)
          .setColor(CLASS_COLOR[selectedValue] || 0x5865F2)
          .setThumbnail(target.displayAvatarURL())
          .setDescription(
            ownedInClass.length > 0
              ? `**Tu possèdes ${ownedInClass.length}/${list.length} Yo-kai:**\n\n${ownedInClass.map(y => `✅ ${y}`).join('\n')}`
              : `**Aucun Yo-kai possédé dans cette catégorie!**`
          )
          .setFooter({ text: 'Robonyan • Créé par ᴠʏᴢᴛᴏʀ' })
          .setTimestamp();

        await i.update({ embeds: [categoryEmbed], components: [dropdown] });
      }
    });

    collector.on('end', () => {
      reply.edit({ components: [] }).catch(() => {});
    });
  },
};
