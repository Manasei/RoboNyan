const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

// Stockage des sondages actifs
const activeSondages = new Map();

// Emojis pour les options
const OPTION_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

// Couleurs selon l'avancement
const POLL_COLORS = {
  active: 0x5865F2,
  ended: 0x2F3136,
  winning: 0x57F287,
};

// Générer une barre de progression stylée
function generateBar(percentage, size = 12) {
  const filled = Math.round((percentage / 100) * size);
  const empty = size - filled;

  const BAR_START_FULL = '▐';
  const BAR_END_FULL = '▌';
  const BAR_FULL = '█';
  const BAR_EMPTY = '░';

  if (filled === 0) return `\`${BAR_START_FULL}${'░'.repeat(size)}${BAR_END_FULL}\``;
  if (filled === size) return `\`${BAR_START_FULL}${'█'.repeat(size)}${BAR_END_FULL}\``;

  return `\`${BAR_START_FULL}${'█'.repeat(filled)}${'░'.repeat(empty)}${BAR_END_FULL}\``;
}

// Générer l'embed du sondage
function generateSondageEmbed(sondageData, ended = false) {
  const totalVotes = sondageData.options.reduce((sum, opt) => sum + opt.votes, 0);
  const maxVotes = Math.max(...sondageData.options.map(o => o.votes));

  let description = `╔══════════════════════╗\n`;
  description += `║  📊 **${sondageData.question}**\n`;
  description += `╚══════════════════════╝\n\n`;

  sondageData.options.forEach((opt, index) => {
    const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
    const isWinning = opt.votes === maxVotes && opt.votes > 0;
    const emoji = OPTION_EMOJIS[index];
    const crown = isWinning && !ended ? ' 👑' : isWinning && ended ? ' 🏆' : '';

    description += `${emoji} **${opt.label}**${crown}\n`;
    description += `${generateBar(percentage)} **${percentage}%** ─ \`${opt.votes} vote${opt.votes !== 1 ? 's' : ''}\`\n\n`;
  });

  description += `\n━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  description += `📬 **Total :** \`${totalVotes} vote${totalVotes !== 1 ? 's' : ''}\``;

  if (!ended && sondageData.endsAt) {
    const remaining = Math.max(0, sondageData.endsAt - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const hours = Math.floor(minutes / 60);
    const timeStr = hours > 0 ? `${hours}h ${minutes % 60}min` : `${minutes}min`;
    description += `  •  ⏱️ **Fin dans :** \`${timeStr}\``;
  }

  const embed = new EmbedBuilder()
    .setColor(ended ? POLL_COLORS.ended : POLL_COLORS.active)
    .setDescription(description)
    .setFooter({ text: ended ? '✅ Sondage terminé' : '🔴 Sondage en cours' });

  return embed;
}

// Générer les boutons (MAX 25 BOUTONS DISCORD)
function generateButtons(sondageData, disabled = false) {
  const rows = [];
  let currentRow = new ActionRowBuilder();

  sondageData.options.forEach((opt, index) => {
    if (currentRow.components.length === 5) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
    }

    const button = new ButtonBuilder()
      .setCustomId(`sondage_vote_${sondageData.id}_${index}`)
      .setLabel(`${OPTION_EMOJIS[index]} ${opt.label} (${opt.votes})`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled);

    currentRow.addComponents(button);
  });

  if (currentRow.components.length > 0) {
    rows.push(currentRow);
  }

  // Ajouter le bouton de clôture
  const closeRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`sondage_close_${sondageData.id}`)
        .setLabel('🔒 Clôturer')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(disabled)
    );

  rows.push(closeRow);
  return rows;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sondage')
    .setDescription('Crée un sondage')
    .addStringOption(option =>
      option
        .setName('question')
        .setDescription('La question du sondage')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('option1')
        .setDescription('Option 1')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('option2')
        .setDescription('Option 2')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('option3')
        .setDescription('Option 3')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('option4')
        .setDescription('Option 4')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('option5')
        .setDescription('Option 5')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('option6')
        .setDescription('Option 6')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('option7')
        .setDescription('Option 7')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('option8')
        .setDescription('Option 8')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('option9')
        .setDescription('Option 9')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('option10')
        .setDescription('Option 10')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option
        .setName('duree')
        .setDescription('Durée en minutes (par défaut 30)')
        .setRequired(false)
    ),

  execute: async (interaction) => {
    try {
      const question = interaction.options.getString('question');
      const duree = interaction.options.getInteger('duree') || 30;

      // Récupérer toutes les options
      const optionsArray = [];
      for (let i = 1; i <= 10; i++) {
        const opt = interaction.options.getString(`option${i}`);
        if (opt) {
          optionsArray.push(opt);
        }
      }

      if (optionsArray.length < 2) {
        return interaction.reply({ content: '❌ Vous devez fournir au moins 2 options.', ephemeral: true });
      }

      const sondageId = `${interaction.channelId}_${Date.now()}`;
      const endsAt = Date.now() + duree * 60000;

      const sondageData = {
        id: sondageId,
        question,
        options: optionsArray.map(label => ({ label, votes: 0 })),
        voters: new Map(),
        authorId: interaction.user.id,
        channelId: interaction.channelId,
        messageId: null,
        endsAt,
        ended: false,
      };

      const embed = generateSondageEmbed(sondageData);
      const buttons = generateButtons(sondageData);

      await interaction.reply({
        embeds: [embed],
        components: buttons,
      });

      const message = await interaction.fetchReply();
      sondageData.messageId = message.id;
      activeSondages.set(sondageId, sondageData);

      // Planifier la clôture automatique
      setTimeout(() => {
        closeSondage(interaction.client, sondageData, message);
      }, duree * 60000);

    } catch (error) {
      console.error('❌ ERREUR EXECUTE:', error);
      await interaction.reply({ content: `❌ Erreur: ${error.message}`, ephemeral: true });
    }
  },

  handleButton: async (interaction) => {
    try {
      const customId = interaction.customId;
      console.log('🔹 CustomID reçu:', customId);

      // Bouton de vote
      if (customId.startsWith('sondage_vote_')) {
        console.log('📊 Tentative de vote...');
        const parts = customId.split('_');
        console.log('Parts:', parts);

        const sondageId = `${parts[2]}_${parts[3]}`;
        const optionIndex = parseInt(parts[4]);

        console.log('SondageID:', sondageId);
        console.log('OptionIndex:', optionIndex);

        const data = activeSondages.get(sondageId);
        console.log('Data trouvée:', !!data);

        if (!data || data.ended) {
          return interaction.reply({ content: '❌ Ce sondage est terminé ou introuvable.', ephemeral: true });
        }

        const previousVote = data.voters.get(interaction.user.id);

        if (previousVote === optionIndex) {
          data.voters.delete(interaction.user.id);
          data.options[optionIndex].votes = Math.max(0, data.options[optionIndex].votes - 1);
          await interaction.reply({ content: `✅ Vous avez retiré votre vote pour **${data.options[optionIndex].label}**.`, ephemeral: true });
        } else {
          if (previousVote !== undefined) {
            data.options[previousVote].votes = Math.max(0, data.options[previousVote].votes - 1);
          }
          data.voters.set(interaction.user.id, optionIndex);
          data.options[optionIndex].votes++;
          await interaction.reply({ content: `✅ Vote enregistré pour **${data.options[optionIndex].label}** ! Recliquez pour retirer votre vote.`, ephemeral: true });
        }

        const newEmbed = generateSondageEmbed(data);
        await interaction.message.edit({ embeds: [newEmbed] });
      }

      // Bouton clôturer
      if (customId.startsWith('sondage_close_')) {
        console.log('🔒 Tentative de clôture...');
        const parts = customId.split('_');
        const sondageId = `${parts[2]}_${parts[3]}`;

        console.log('SondageID close:', sondageId);
        const data = activeSondages.get(sondageId);
        console.log('Data clôture trouvée:', !!data);

        if (!data) return interaction.reply({ content: '❌ Sondage introuvable.', ephemeral: true });

        if (interaction.user.id !== data.authorId && !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
          return interaction.reply({ content: '❌ Seul le créateur du sondage ou un modérateur peut le clôturer.', ephemeral: true });
        }

        await interaction.deferUpdate();
        await closeSondage(interaction.client, data, interaction.message);
      }
    } catch (error) {
      console.error('❌ ERREUR HANDLEBUTTON:', error);
      try {
        await interaction.reply({ content: `❌ Erreur: ${error.message}`, ephemeral: true });
      } catch (e) {
        console.error('Impossible de répondre:', e);
      }
    }
  },

  activeSondages,
};

// Clôturer un sondage
async function closeSondage(client, data, message = null) {
  data.ended = true;

  const finalEmbed = generateSondageEmbed(data, true);
  const disabledButtons = generateButtons(data, true);

  try {
    if (!message) {
      const channel = await client.channels.fetch(data.channelId);
      message = await channel.messages.fetch(data.messageId);
    }

    await message.edit({
      embeds: [finalEmbed],
      components: disabledButtons,
    });
  } catch (e) {
    console.error('Erreur clôture sondage:', e);
  }

  activeSondages.delete(data.id);
}
