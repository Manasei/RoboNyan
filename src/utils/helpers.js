/**
 * Robonyan — Utilitaires généraux
 * Créé par ᴠʏᴢᴛᴏʀ
 */

const { EmbedBuilder } = require('discord.js');
const fs   = require('fs');
const path = require('path');

// ─── Chemins ────────────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const INV_DIR  = path.join(DATA_DIR, 'inventory');
const BAG_DIR  = path.join(DATA_DIR, 'bag');

for (const d of [INV_DIR, BAG_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// ─── Données Yo-kai ─────────────────────────────────────────────────────────
const yokaiList  = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'yokai_list.json'), 'utf-8'));
const fullNames  = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'full_name_fr.json'), 'utf-8'));
const coinData   = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'coin.json'), 'utf-8'));
const itemsData  = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'items.json'), 'utf-8'));
const tagsData   = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'tags.json'), 'utf-8'));
const blacklisted = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'blacklisted_yokai.json'), 'utf-8'));

// Liste aplatie de tous les yokai par classe
const ALL_CLASSES = ['E','D','C','B','A','S','treasureS','SpecialS','LegendaryS','DivinityS','Boss','Shiny'];

/**
 * Retourne { yokai, class: classKey, classData } ou null
 */
function findYokai(name) {
  for (const cls of ALL_CLASSES) {
    if (!yokaiList[cls]) continue;
    const list = yokaiList[cls].yokai_list;
    if (list && list.includes(name)) {
      return { yokai: name, class: cls, classData: yokaiList[cls] };
    }
  }
  return null;
}

/**
 * Correspondance souple (insensible à la casse + accents partiels)
 */
function smartMatch(query, candidates) {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Exact
  for (const c of candidates) {
    const cn = c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (cn === q) return c;
  }
  // Starts with
  for (const c of candidates) {
    const cn = c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (cn.startsWith(q)) return c;
  }
  // Includes
  for (const c of candidates) {
    const cn = c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (cn.includes(q)) return c;
  }
  return null;
}

// ─── Inventaire ─────────────────────────────────────────────────────────────
function getInv(userId) {
  const file = path.join(INV_DIR, `${userId}.json`);
  if (!fs.existsSync(file)) return {};
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch { return {}; }
}

function saveInv(userId, data) {
  fs.writeFileSync(path.join(INV_DIR, `${userId}.json`), JSON.stringify(data, null, 2));
}

function getBag(userId) {
  const file = path.join(BAG_DIR, `${userId}.json`);
  if (!fs.existsSync(file)) return {};
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch { return {}; }
}

function saveBag(userId, data) {
  fs.writeFileSync(path.join(BAG_DIR, `${userId}.json`), JSON.stringify(data, null, 2));
}

// ─── Économie (orbes) ────────────────────────────────────────────────────────
const ECONOMY_FILE = path.join(DATA_DIR, 'economy.json');
function getEconomy() {
  if (!fs.existsSync(ECONOMY_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(ECONOMY_FILE, 'utf-8')); }
  catch { return {}; }
}
function saveEconomy(data) {
  fs.writeFileSync(ECONOMY_FILE, JSON.stringify(data, null, 2));
}
function getOrbes(userId) {
  return getEconomy()[String(userId)] || 0;
}
function addOrbes(userId, amount) {
  const eco = getEconomy();
  eco[String(userId)] = (eco[String(userId)] || 0) + amount;
  saveEconomy(eco);
  return eco[String(userId)];
}

// ─── Embeds standardisés ────────────────────────────────────────────────────
function successEmbed(title, description) {
  return new EmbedBuilder().setTitle(title).setDescription(description).setColor(0x57F287);
}
function errorEmbed(title, description) {
  return new EmbedBuilder().setTitle(`❌ ${title}`).setDescription(description).setColor(0xED4245);
}
function infoEmbed(title, description) {
  return new EmbedBuilder().setTitle(title).setDescription(description).setColor(0x5865F2);
}
function modEmbed({ title, description, color, moderator, target, reason, fields = [] }) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: `Par ${moderator.displayName}`, iconURL: moderator.displayAvatarURL() });
  if (target) embed.setThumbnail(target.displayAvatarURL());
  if (reason) embed.addFields({ name: '📋 Raison', value: reason, inline: false });
  for (const f of fields) embed.addFields(f);
  return embed;
}

// ─── Durée ──────────────────────────────────────────────────────────────────
function parseDuration(str) {
  const match = str.trim().toLowerCase().match(/^(\d+)([smhdw])$/);
  if (!match) return null;
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
  return parseInt(match[1]) * units[match[2]];
}

function formatDuration(ms) {
  const intervals = [['semaine(s)', 604800000], ['jour(s)', 86400000], ['heure(s)', 3600000], ['minute(s)', 60000], ['seconde(s)', 1000]];
  const parts = [];
  for (const [name, val] of intervals) {
    const v = Math.floor(ms / val);
    if (v) { ms -= v * val; parts.push(`${v} ${name}`); }
  }
  return parts.join(', ') || '0 seconde';
}

// ─── Exports ────────────────────────────────────────────────────────────────
module.exports = {
  yokaiList, fullNames, coinData, itemsData, tagsData, blacklisted,
  ALL_CLASSES, findYokai, smartMatch,
  getInv, saveInv, getBag, saveBag,
  getOrbes, addOrbes,
  successEmbed, errorEmbed, infoEmbed, modEmbed,
  parseDuration, formatDuration,
};
