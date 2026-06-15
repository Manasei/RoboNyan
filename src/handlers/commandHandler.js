const fs   = require('fs');
const path = require('path');

function loadCommands(client) {
  const dir = path.join(__dirname, '..', 'commands');

  function registerCmd(cmd, source) {
    if (!cmd?.data || !cmd?.execute) return;
    client.commands.set(cmd.data.name, cmd);
    console.log(`[CMD] ✅ ${cmd.data.name}`);
  }

  function walk(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.endsWith('.js')) continue;
      const mod = require(full);

      // Single export: { data, execute }
      if (mod?.data && mod?.execute) {
        registerCmd(mod, full);
      }
      // Multi export: { ban: { data, execute }, kick: { data, execute }, ... }
      else if (typeof mod === 'object') {
        for (const [, cmd] of Object.entries(mod)) {
          registerCmd(cmd, full);
        }
      }
    }
  }

  walk(dir);
}

module.exports = { loadCommands };
