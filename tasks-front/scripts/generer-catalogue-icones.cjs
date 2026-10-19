/*
 * Génère le catalogue des icônes du sélecteur (app-choose-dialog) depuis les
 * métadonnées de @fortawesome/fontawesome-free installé.
 *
 * À relancer après une mise à jour de Font Awesome :
 *   node scripts/generer-catalogue-icones.cjs
 *
 * Une icône par code Unicode : ce code est la clé primaire de l'entité Icone
 * côté serveur. Les variantes « regular » partagent le code de la « solid »,
 * on ne garde donc que solid, et brands pour les marques.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const META = path.join(__dirname, '../node_modules/@fortawesome/fontawesome-free/metadata');
const SORTIE = path.join(__dirname, '../src/app/common/icone-field/choose-dialog/catalogue-icones.data.ts');

/** Les icônes de l'ancienne liste, proposées en premier (codes Unicode). */
const COURANTES = [
  'f0ae', 'f058', 'f073', 'f0ca', 'f017', 'f085', 'f201', 'f15c', 'f4ad', 'f0b1',
  'f0c0', 'f041', 'f0e0', 'f252', 'f02d', 'f1d8', 'f46d', 'f080', 'f3fd', 'f573',
  'f27a', 'f0a1', 'f0f3', 'f188', 'f274', 'f08d', 'f0ac', 'f0c1', 'f07c', 'f06a',
  'f7f5', 'f091', 'f0d1', 'f272', 'f200', 'f05a', 'f3ed', 'f1f6', 'f271', 'f4b3',
  'f024', 'f0ad', 'f0c6', 'f24d', 'f05e', 'f15b', 'f24e', 'f075', 'f2c1', 'f0c7',
  'f1f8', 'f0e2', 'f01e', 'f02f', 'f019', 'f093', 'f002', 'f303', 'f0c5', 'f0c4',
  'f0ea', 'f023', 'f09c'
];

const LIBELLES = {
  'accessibility': 'Accessibilité', 'alert': 'Alertes', 'alphabet': 'Alphabet',
  'animals': 'Animaux', 'arrows': 'Flèches', 'astronomy': 'Astronomie',
  'automotive': 'Automobile', 'buildings': 'Bâtiments', 'business': 'Entreprise',
  'camping': 'Camping', 'charity': 'Solidarité', 'charts-diagrams': 'Graphiques',
  'childhood': 'Enfance', 'clothing-fashion': 'Vêtements', 'coding': 'Développement',
  'communication': 'Communication', 'connectivity': 'Connectivité',
  'construction': 'Construction', 'design': 'Design', 'devices-hardware': 'Appareils',
  'disaster': 'Catastrophes', 'editing': 'Édition', 'education': 'Éducation',
  'emoji': 'Émoticônes', 'energy': 'Énergie', 'files': 'Fichiers',
  'film-video': 'Vidéo', 'food-beverage': 'Alimentation',
  'fruits-vegetables': 'Fruits et légumes', 'gaming': 'Jeux', 'gender': 'Genres',
  'halloween': 'Halloween', 'hands': 'Mains', 'holidays': 'Fêtes',
  'household': 'Maison', 'humanitarian': 'Humanitaire', 'logistics': 'Logistique',
  'maps': 'Cartes', 'maritime': 'Maritime', 'marketing': 'Marketing',
  'mathematics': 'Mathématiques', 'media-playback': 'Lecture média',
  'medical-health': 'Santé', 'money': 'Argent', 'moving': 'Déménagement',
  'music-audio': 'Musique', 'nature': 'Nature', 'numbers': 'Chiffres',
  'photos-images': 'Photos', 'political': 'Politique',
  'punctuation-symbols': 'Ponctuation', 'religion': 'Religion', 'science': 'Science',
  'science-fiction': 'Science-fiction', 'security': 'Sécurité', 'shapes': 'Formes',
  'shopping': 'Achats', 'social': 'Social', 'spinners': 'Chargement',
  'sports-fitness': 'Sport', 'text-formatting': 'Mise en forme', 'time': 'Temps',
  'toggle': 'Interrupteurs', 'transportation': 'Transports',
  'travel-hotel': 'Voyage', 'users-people': 'Personnes', 'weather': 'Météo',
  'writing': 'Écriture'
};

const icones = yaml.load(fs.readFileSync(path.join(META, 'icons.yml'), 'utf8'));
const categories = yaml.load(fs.readFileSync(path.join(META, 'categories.yml'), 'utf8'));

/** nom -> [unicode, style, texte de recherche] */
const retenues = {};
const parCode = {};
for (const [nom, icone] of Object.entries(icones)) {
  const styles = icone.styles || [];
  const style = styles.includes('solid') ? 's' : styles.includes('brands') ? 'b' : null;
  if (!style || parCode[icone.unicode]) continue;
  parCode[icone.unicode] = nom;
  const termes = [icone.label, ...((icone.search && icone.search.terms) || [])]
    .map(t => String(t).toLowerCase());
  retenues[nom] = [icone.unicode, style, [...new Set(termes)].join(' ')];
}

const groupes = [['Courantes', COURANTES.map(code => parCode[code]).filter(Boolean)]];
const classees = new Set();
const autres = Object.entries(categories)
  .map(([cle, cat]) => {
    const noms = cat.icons.filter(nom => retenues[nom]);
    noms.forEach(nom => classees.add(nom));
    return [LIBELLES[cle] || cat.label, noms];
  })
  .filter(([, noms]) => noms.length)
  .sort(([a], [b]) => a.localeCompare(b, 'fr'));
groupes.push(...autres);
const marques = Object.keys(retenues).filter(nom => retenues[nom][1] === 'b' && !classees.has(nom));
const divers = Object.keys(retenues).filter(nom => retenues[nom][1] === 's' && !classees.has(nom));
if (divers.length) groupes.push(['Divers', divers]);
if (marques.length) groupes.push(['Marques', marques]);

const version = require(path.join(META, '../package.json')).version;
const contenu = `// Généré par scripts/generer-catalogue-icones.cjs (Font Awesome ${version}).
// Ne pas modifier à la main : relancer le script.

/** nom -> [code Unicode, style (s = solid, b = brands), texte de recherche] */
export const ICONES_FA: Record<string, [string, 's' | 'b', string]> = ${JSON.stringify(retenues)};

/** Catégories du sélecteur, « Courantes » en tête : [libellé, noms d'icônes]. */
export const CATEGORIES_FA: [string, string[]][] = ${JSON.stringify(groupes)};
`;
fs.writeFileSync(SORTIE, contenu, 'utf8');
console.log(`${Object.keys(retenues).length} icônes, ${groupes.length} catégories -> ${SORTIE}`);
