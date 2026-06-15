/**
 * Robonyan — Bot Discord Yo-kai
 * Créé par ᴠʏᴢᴛᴏʀ
 *
 * Point d'entrée unique — inclut le déploiement automatique des slash commands.
 */

require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection, REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents }   = require('./handlers/eventHandler');

// ─── Client ────────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// ─── Collections ───────────────────────────────────────────────────────────
client.commands  = new Collection();
client.cooldowns = new Collection();
client.warnings  = new Map();
client.polls     = new Map();

// ─── Infos globales ─────────────────────────────────────────────────────────
client.BOT_NAME = 'Robonyan';
client.CREATOR  = 'ᴠʏᴢᴛᴏʀ';
client.VERSION  = '1.0.0';

// ─── Déploiement automatique des slash commands ──────────────────────────────
async function deployCommands() {
  const token    = process.env.TOKEN;
  const clientId = process.env.CLIENT_ID;
  const guildId  = process.env.SUPPORT_GUILD_ID;

  if (!token || !clientId) {
    console.warn('[DEPLOY] TOKEN ou CLIENT_ID manquant — déploiement ignoré.');
    return;
  }

  // Collecte toutes les commandes (gère export simple ET export multiple)
  const commandsJSON = [];
  const cmdDir = path.join(__dirname, 'commands');

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.endsWith('.js')) continue;
      try {
        const mod = require(full);
        if (mod?.data?.toJSON) {
          commandsJSON.push(mod.data.toJSON());
        } else if (typeof mod === 'object') {
          for (const [, cmd] of Object.entries(mod)) {
            if (cmd?.data?.toJSON) commandsJSON.push(cmd.data.toJSON());
          }
        }
      } catch { /* déjà chargé par loadCommands, on ignore */ }
    }
  }
  walk(cmdDir);

  if (commandsJSON.length === 0) {
    console.warn('[DEPLOY] Aucune commande trouvée — déploiement ignoré.');
    return;
  }

  try {
    const rest  = new REST().setToken(token);
    const route = guildId
      ? Routes.applicationGuildCommands(clientId, guildId)   // ⚡ Instantané
      : Routes.applicationCommands(clientId);                 // 🌐 Global (~1h)

    await rest.put(route, { body: commandsJSON });

    const scope = guildId ? `serveur ${guildId}` : 'global';
    console.log(`[DEPLOY] ✅ ${commandsJSON.length} slash commands déployées (${scope})`);
  } catch (err) {
    console.error('[DEPLOY] ❌ Échec du déploiement :', err.message);
    if (err.status === 401) console.error('           → TOKEN invalide');
    if (err.status === 403) console.error('           → CLIENT_ID ou SUPPORT_GUILD_ID invalide');
  }
}

// ─── Démarrage ───────────────────────────────────────────────────────────────
(async () => {
  // 1. Charger les commandes en mémoire
  loadCommands(client);

  // 2. Déployer les slash commands sur Discord
  await deployCommands();

  // 3. Charger les events
  loadEvents(client);

  // 4. Connexion
  client.login(process.env.TOKEN).catch(err => {
    console.error('[FATAL] Impossible de se connecter :', err.message);
    process.exit(1);
  });
})();
