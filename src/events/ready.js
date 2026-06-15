const { ActivityType } = require('discord.js');

module.exports = {
  name: 'clientReady',
  once: true,
  execute(c, client) {
    // clientReady : discord.js passe le client en 1er argument
    // Notre eventHandler l'ajoute en dernier → on prend celui qui a .user
    const bot = c?.user ? c : client;

    console.log(`\n🐱 ${bot.BOT_NAME} est en ligne ! (${bot.user.tag})`);
    console.log(`👤 Créé par ${bot.CREATOR}`);
    console.log(`📦 ${bot.commands.size} commandes chargées\n`);

    const statuses = [
      { name: `✨ v${bot.VERSION}`, type: ActivityType.Playing },
      { name: '/bkai', type: ActivityType.Playing },
      { name: '/help', type: ActivityType.Listening },
      { name: 'les Yo-kai 🐱', type: ActivityType.Watching },
    ];

    let i = 0;
    bot.user.setActivity(statuses[0].name, { type: statuses[0].type });
    setInterval(() => {
      i = (i + 1) % statuses.length;
      bot.user.setActivity(statuses[i].name, { type: statuses[i].type });
    }, 60_000);
  },
};
