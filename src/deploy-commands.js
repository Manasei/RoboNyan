/**
 * Robonyan — Déploiement des slash commands
 * Usage : node src/deploy-commands.js
 * Créé par ᴠʏᴢᴛᴏʀ
 */

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');

if (!process.env.TOKEN || !process.env.CLIENT_ID) {
  console.error('❌ TOKEN ou CLIENT_ID manquant dans le fichier .env');
  process.exit(1);
}

const commands = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (!entry.name.endsWith('.js')) continue;

    try {
      const mod = require(full);

      // Export simple : { data, execute }
      if (mod?.data?.toJSON) {
        commands.push(mod.data.toJSON());
        console.log(`  ✅ ${mod.data.name}`);

      // Export multiple : { ban: { data, execute }, kick: { ... } }
      } else if (typeof mod === 'object') {
        for (const [, cmd] of Object.entries(mod)) {
          if (cmd?.data?.toJSON) {
            commands.push(cmd.data.toJSON());
            console.log(`  ✅ ${cmd.data.name}`);
          }
        }
      }
    } catch (err) {
      console.warn(`  ⚠️  Ignoré (${entry.name}): ${err.message}`);
    }
  }
}

console.log('\n📦 Lecture des commandes…');
walk(path.join(__dirname, 'commands'));
console.log(`\n📡 Déploiement de ${commands.length} commandes en cours…\n`);

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );
    console.log(`✅ ${commands.length} commandes déployées avec succès !`);
    console.log('ℹ️  Les commandes globales peuvent prendre jusqu\'à 1h à apparaître.');
    console.log('   Pour un déploiement instantané sur un serveur précis, utilise :');
    console.log('   npm run deploy:guild\n');
  } catch (err) {
    console.error('❌ Erreur lors du déploiement :', err.message);
    if (err.code === 50035) console.error('   → Vérifie que CLIENT_ID est correct dans .env');
    if (err.status === 401) console.error('   → Vérifie que TOKEN est correct dans .env');
  }
})();
