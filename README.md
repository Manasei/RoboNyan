# 🐱 Robonyan
> Bot Discord Yo-kai — Créé par **ᴠʏᴢᴛᴏʀ**

---

## 📦 Installation

### Prérequis
- **Node.js v18+** ([nodejs.org](https://nodejs.org))
- Un bot Discord créé sur le [Discord Developer Portal](https://discord.com/developers/applications)

### Étapes

```bash
# 1. Cloner / décompresser le projet
cd robonyan-js

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env.example .env
# → Remplir TOKEN, CLIENT_ID, SUPPORT_GUILD_ID dans .env

# 4. Déployer les slash commands (à faire une seule fois)
npm run deploy

# 5. Lancer le bot
npm start
```

---

## ⚙️ Configuration `.env`

| Variable | Description |
|---|---|
| `TOKEN` | Token de ton bot Discord |
| `CLIENT_ID` | ID de ton application Discord |
| `SUPPORT_GUILD_ID` | ID de ton serveur principal |
| `PREFIX` | Préfixe (non utilisé pour les slash, usage futur) |
| `INVITE_LINK` | Lien d'invitation du bot |

---

## 🗂️ Structure du projet

```
robonyan-js/
├── src/
│   ├── index.js                  ← Point d'entrée
│   ├── deploy-commands.js        ← Déploiement des slash commands
│   ├── commands/
│   │   ├── yokai/
│   │   │   ├── bkai.js           ← /bkai  (gacha)
│   │   │   ├── medallium.js      ← /medallium
│   │   │   └── search.js         ← /search
│   │   ├── economy/
│   │   │   └── orbes.js          ← /orbes
│   │   ├── moderation/
│   │   │   └── _all.js           ← /ban /kick /mute /warn etc.
│   │   ├── poll/
│   │   │   └── sondage.js        ← /sondage
│   │   └── utils/
│   │       ├── help.js           ← /help
│   │       └── credits.js        ← /credits
│   ├── events/
│   │   ├── ready.js
│   │   └── interactionCreate.js
│   ├── handlers/
│   │   ├── commandHandler.js
│   │   └── eventHandler.js
│   └── utils/
│       └── helpers.js            ← Fonctions utilitaires
├── data/
│   ├── yokai_list.json
│   ├── full_name_fr.json
│   ├── items.json
│   ├── coin.json
│   ├── tags.json
│   ├── blacklisted_yokai.json
│   ├── inventory/                ← Inventaires joueurs (auto-généré)
│   ├── bag/                      ← Sacs joueurs (auto-généré)
│   └── economy.json              ← Orbes (auto-généré)
├── .env.example
├── package.json
└── README.md
```

---

## 🎲 Commandes Yo-kai

| Commande | Description |
|---|---|
| `/bkai` | Tirer un Yo-kai aléatoire (cooldown 1h30) |
| `/medallium [joueur]` | Voir la collection de Yo-kai |
| `/search <nom>` | Rechercher un Yo-kai (avec autocomplétion) |

---

## 🔮 Économie

| Commande | Description |
|---|---|
| `/orbes [joueur]` | Voir le solde d'orbes oni |

> Les orbes s'obtiennent en récupérant des **doublons** via `/bkai`.

---

## 🗳️ Sondages

| Commande | Description |
|---|---|
| `/sondage créer` | Créer un sondage (2–8 choix, durée optionnelle, mode anonyme) |
| `/sondage résultats <id>` | Voir les résultats d'un sondage |

**Fonctionnalités :**
- Jusqu'à **8 choix** avec emojis drapeaux
- **Durée automatique** : `30s`, `10m`, `2h`, `1d`, `1w`
- **Mode anonyme** (qui a voté quoi est masqué)
- **Boutons interactifs** pour voter (1 vote par personne, modifiable)
- **Retrait de vote** en recliquant sur le même choix
- **Bouton de clôture** (créateur ou modérateur)
- **Résultats en temps réel** avec barres de progression

---

## 🛡️ Modération

| Commande | Permission | Description |
|---|---|---|
| `/ban` | Ban Members | Bannir un membre |
| `/unban` | Ban Members | Débannir par ID |
| `/tempban` | Ban Members | Bannissement temporaire |
| `/kick` | Kick Members | Expulser un membre |
| `/mute` | Moderate Members | Timeout (max 28j) |
| `/unmute` | Moderate Members | Retirer un timeout |
| `/warn` | Moderate Members | Avertir un membre |
| `/warns` | Moderate Members | Voir les warns |
| `/clearwarns` | Administrator | Effacer tous les warns |
| `/purge` | Manage Messages | Supprimer 1–100 messages |
| `/slowmode` | Manage Channels | Définir le slowmode |
| `/lock` | Manage Channels | Verrouiller un salon |
| `/unlock` | Manage Channels | Déverrouiller un salon |
| `/nickname` | Manage Nicknames | Modifier un pseudo |
| `/userinfo` | — | Infos sur un membre |
| `/serverinfo` | — | Infos sur le serveur |

**Fonctionnalités :**
- **DM automatique** à l'utilisateur ciblé pour ban/kick/mute/warn
- **Embeds stylés** avec couleurs selon la gravité
- **Vérification de hiérarchie** des rôles
- **Débannissement automatique** pour les tempbans
- Durées flexibles : `30s`, `10m`, `2h`, `1d`, `1w`

---

## 🐱 Infos

- **Nom :** Robonyan
- **Créateur :** ᴠʏᴢᴛᴏʀ
- **Version :** 1.0.0
- **Technologie :** discord.js v14 (Node.js 18+)
