const { InteractionType } = require('discord.js');
const { errorEmbed } = require('../utils/helpers');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {

    // ── Slash commands ────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction, client);
      } catch (err) {
        console.error(`[ERR] /${interaction.commandName}:`, err);
        const embed = errorEmbed('Erreur', 'Une erreur est survenue lors de l\'exécution de cette commande.');
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [embed], ephemeral: true }).catch(() => {});
        } else {
          await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
        }
      }
      return;
    }

    // ── Autocomplete ─────────────────────────────────────────────────────
    if (interaction.isAutocomplete()) {
      const cmd = client.commands.get(interaction.commandName);
      if (cmd?.autocomplete) {
        await cmd.autocomplete(interaction, client).catch(() => {});
      }
      return;
    }

    // ── Boutons (polls, etc.) ─────────────────────────────────────────────
    if (interaction.isButton()) {
      const [type, ...rest] = interaction.customId.split(':');

      // Votes de sondage
      if (type === 'poll_vote') {
        const pollCmd = client.commands.get('sondage');
        if (pollCmd?.handleVote) {
          await pollCmd.handleVote(interaction, client, rest).catch(console.error);
        }
        return;
      }

      // Résultats publics du sondage
      if (type === 'poll_results') {
        const pollCmd = client.commands.get('sondage');
        if (pollCmd?.handleResults) {
          await pollCmd.handleResults(interaction, client, rest).catch(console.error);
        }
        return;
      }

      // Résultats admin du sondage
      if (type === 'poll_results_admin') {
        const pollCmd = client.commands.get('sondage');
        if (pollCmd?.handleResultsAdmin) {
          await pollCmd.handleResultsAdmin(interaction, client, rest).catch(console.error);
        }
        return;
      }

      // Fin de sondage
      if (type === 'poll_end') {
        const pollCmd = client.commands.get('sondage');
        if (pollCmd?.handleEnd) {
          await pollCmd.handleEnd(interaction, client, rest).catch(console.error);
        }
        return;
      }
    }
  },
};
