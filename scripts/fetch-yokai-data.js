/**
 * ============================================================
 *  Robonyan — Générateur de yokai_data.json
 *  Créé par ᴠʏᴢᴛᴏʀ
 * ============================================================
 *
 *  Lance ce script UNE SEULE FOIS sur ton PC :
 *    node scripts/fetch-yokai-data.js
 *
 *  Il va interroger l'API du wiki Fandom FR pour récupérer
 *  l'image et le rang de chaque Yo-kai de yokai_list.json,
 *  puis générer data/yokai_data.json utilisé par le bot.
 *
 *  Dépendances : aucune (utilise fetch natif Node 18+)
 * ============================================================
 */

const fs   = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const WIKI_API   = 'https://yokaiwatch.fandom.com/fr/api.php';
const THUMB_SIZE = 300;           // px de la miniature
const DELAY_MS   = 150;           // délai entre requêtes (politesse envers le wiki)
const BATCH_SIZE = 50;            // nb de pages par requête API (max Fandom = 50)

const DATA_DIR    = path.join(__dirname, '..', 'data');
const INPUT_FILE  = path.join(DATA_DIR, 'yokai_list.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'yokai_data.json');

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Encode un titre pour l'API Fandom (remplace espaces par _ etc.) */
function encodeTitle(name) {
  return name.trim();
}

/**
 * Requête l'API MediaWiki pour un batch de titres.
 * Retourne un objet { [title]: { image, rank, tribe, wikiUrl } }
 */
async function fetchBatch(titles) {
  const params = new URLSearchParams({
    action:      'query',
    titles:      titles.join('|'),
    prop:        'pageimages|revisions',
    pithumbsize: String(THUMB_SIZE),
    rvprop:      'content',
    rvslots:     'main',
    format:      'json',
    formatversion: '2',
  });

  const url = `${WIKI_API}?${params}`;
  const res  = await fetch(url, {
    headers: { 'User-Agent': 'RobonyanBot/1.0 (discord bot; contact: vyztordev)' },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
  const json = await res.json();

  const results = {};
  const pages   = json?.query?.pages || [];

  for (const page of pages) {
    if (page.missing) continue;

    const title    = page.title;
    const imageUrl = page.thumbnail?.source || null;
    const content  = page.revisions?.[0]?.slots?.main?.content || '';

    // Extraire le rang depuis le wikicode (|rang = S, |rank = A, etc.)
    const rankMatch = content.match(/\|\s*(?:rang|rank)\s*=\s*([^\n|}\]]+)/i);
    const rank      = rankMatch ? rankMatch[1].trim().toUpperCase() : null;

    // Extraire la tribu
    const tribeMatch = content.match(/\|\s*tribu\s*=\s*([^\n|}\]]+)/i);
    const tribe      = tribeMatch ? tribeMatch[1].trim() : null;

    results[title] = {
      image:   imageUrl,
      rank:    rank,
      tribe:   tribe,
      wikiUrl: `https://yokaiwatch.fandom.com/fr/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    };
  }

  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🐱 Robonyan — Générateur de yokai_data.json');
  console.log('===========================================\n');

  // Charger la liste existante
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Fichier introuvable : ${INPUT_FILE}`);
    process.exit(1);
  }

  const yokaiList = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

  // Récupérer les données existantes si le fichier existe déjà (reprise)
  let existing = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
    console.log(`♻️  Reprise — ${Object.keys(existing).length} yokai déjà en cache.\n`);
  }

  // Collecter tous les noms uniques
  const allNames = new Set();
  for (const cls of Object.keys(yokaiList)) {
    for (const name of (yokaiList[cls]?.yokai_list || [])) {
      allNames.add(name);
    }
  }

  // Filtrer ceux qu'on n'a pas encore
  const todo = [...allNames].filter(n => !existing[n]);
  console.log(`📋 ${allNames.size} Yo-kai au total`);
  console.log(`🔍 ${todo.length} à récupérer depuis le wiki\n`);

  if (todo.length === 0) {
    console.log('✅ Tout est déjà à jour !');
    writeOutput(existing, yokaiList);
    return;
  }

  // Découper en batches
  let done    = 0;
  let errors  = 0;
  const data  = { ...existing };

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch   = todo.slice(i, i + BATCH_SIZE);
    const percent = Math.round(((done) / todo.length) * 100);

    process.stdout.write(`\r⏳ ${done}/${todo.length} (${percent}%) — batch ${Math.floor(i / BATCH_SIZE) + 1}…`);

    try {
      const results = await fetchBatch(batch);

      // Pour chaque nom du batch, stocker le résultat ou un placeholder
      for (const name of batch) {
        if (results[name]) {
          data[name] = results[name];
        } else {
          // Page introuvable — on stocke quand même pour ne pas ré-essayer
          data[name] = { image: null, rank: null, tribe: null, wikiUrl: null, notFound: true };
          errors++;
        }
      }

      done += batch.length;
    } catch (err) {
      console.error(`\n⚠️  Erreur batch à l'index ${i} :`, err.message);
      errors++;
    }

    // Sauvegarde intermédiaire toutes les 200 entrées
    if (done % 200 === 0) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    }

    await sleep(DELAY_MS);
  }

  process.stdout.write('\n');
  writeOutput(data, yokaiList);

  const found    = Object.values(data).filter(v => v.image).length;
  const notFound = Object.values(data).filter(v => v.notFound).length;

  console.log(`\n✅ Terminé !`);
  console.log(`   📸 ${found} images trouvées`);
  console.log(`   ❓ ${notFound} yokai sans page wiki`);
  console.log(`   💾 Fichier sauvegardé : ${OUTPUT_FILE}\n`);
}

function writeOutput(data, yokaiList) {
  // Enrichir avec la classe de yokai_list.json
  for (const cls of Object.keys(yokaiList)) {
    for (const name of (yokaiList[cls]?.yokai_list || [])) {
      if (data[name] && !data[name].notFound) {
        data[name].class     = cls;
        data[name].className = yokaiList[cls].class_name;
        data[name].color     = yokaiList[cls].color;
      }
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
}

main().catch(err => {
  console.error('\n❌ Erreur fatale :', err);
  process.exit(1);
});
