import {Issue, Repertoire} from '../../type/issue';

/*
 * Fichiers d'une issue à plat : l'arborescence rendue par `api/load-directory`
 * devient une liste, chaque fichier avec le dossier qui le contient. Fonctions pures.
 */

export interface FichierIssue {
  fichier: Repertoire;
  nom: string;
  /** Dossier du fichier depuis la racine de l'issue : « Plans › Étage 1 » ; vide à la racine. */
  dossier: string;
  /** Les mêmes dossiers, un par un : le premier est celui d'une sous-tâche (sa clé) quand elle a ses fichiers. */
  dossiers: string[];
  /** Minuscules, sans point : « pdf ». */
  extension: string;
  /** Date d'envoi connue en base ; null pour un fichier déposé hors de l'application. */
  date: number | null;
  uploadeur: string;
}

/** Tous les fichiers de l'arborescence, du plus récent au plus ancien, puis par nom. */
export function aplatir(racine: Repertoire | null | undefined): FichierIssue[] {
  const fichiers: FichierIssue[] = [];
  const parcourir = (noeud: Repertoire, dossiers: string[]) => {
    for (const enfant of noeud.repertoires ?? []) {
      if (enfant.type === 'directory') {
        parcourir(enfant, [...dossiers, String(enfant.fileName ?? '')]);
      } else {
        const nom = String(enfant.fileName ?? '');
        const date = enfant.dateUpload ? new Date(enfant.dateUpload).getTime() : NaN;
        fichiers.push({
          fichier: enfant,
          nom,
          dossier: dossiers.join(' › '),
          dossiers,
          extension: nom.includes('.') ? nom.split('.').pop()!.toLowerCase() : '',
          date: isNaN(date) ? null : date,
          uploadeur: enfant.uploadeur ?? ''
        });
      }
    }
  };
  if (racine) {
    parcourir(racine, []);
  }
  return fichiers.sort((a, b) => (b.date ?? -Infinity) - (a.date ?? -Infinity) || a.nom.localeCompare(b.nom, 'fr'));
}

/** Une sous-tâche telle que la liste la montre à côté de ses fichiers. */
export interface TacheFichier {
  issue: Issue;
  cle: string;
  titre: string;
}

/**
 * La sous-tâche d'un fichier : son dossier est rangé dans celui du projet, sous
 * la clé de la sous-tâche (`BATI-1/PLAN-19/…`). Sinon, le fichier est au projet.
 */
export function tacheDuFichier(fichier: FichierIssue, taches: Map<string, TacheFichier>): TacheFichier | null {
  return fichier.dossiers.length ? taches.get(fichier.dossiers[0]) ?? null : null;
}

/** Recherche sur le nom, le dossier, l'auteur et la sous-tâche, sans tenir compte des accents ni de la casse. */
export function filtrer(fichiers: FichierIssue[], recherche: string,
                        taches: Map<string, TacheFichier> = new Map()): FichierIssue[] {
  const cle = sansAccents(recherche.trim());
  if (!cle) {
    return fichiers;
  }
  return fichiers.filter(f => {
    const tache = tacheDuFichier(f, taches);
    return sansAccents(`${f.nom} ${f.dossier} ${f.uploadeur} ${tache?.titre ?? ''}`).includes(cle);
  });
}

/** Un sous-dossier du dossier ouvert : son nom, ses fichiers (sous-dossiers compris), sa sous-tâche s'il est le sien. */
export interface DossierVue {
  nom: string;
  /** Chemin depuis la racine de l'issue, ce dossier compris. */
  chemin: string[];
  nombre: number;
  tache: TacheFichier | null;
}

/** Ce que montre un dossier ouvert : ses sous-dossiers, puis ses propres fichiers. */
export interface ContenuDossier {
  dossiers: DossierVue[];
  fichiers: FichierIssue[];
}

/**
 * Contenu du dossier `chemin` (vide : la racine), tiré de la liste à plat :
 * les fichiers dont le dossier est exactement celui-là, et les sous-dossiers
 * qui en contiennent, avec leur nombre. Un dossier vide n'apparaît pas.
 * Au premier niveau, un dossier nommé d'après la clé d'une sous-tâche porte son nom.
 */
export function contenuDossier(fichiers: FichierIssue[], chemin: string[],
                               taches: Map<string, TacheFichier> = new Map()): ContenuDossier {
  const sousDossiers = new Map<string, number>();
  const ici: FichierIssue[] = [];
  for (const f of fichiers) {
    if (!commencePar(f.dossiers, chemin)) {
      continue;
    }
    if (f.dossiers.length === chemin.length) {
      ici.push(f);
    } else {
      const nom = f.dossiers[chemin.length];
      sousDossiers.set(nom, (sousDossiers.get(nom) ?? 0) + 1);
    }
  }
  const dossiers = [...sousDossiers.entries()]
    .map(([nom, nombre]) => ({
      nom,
      chemin: [...chemin, nom],
      nombre,
      tache: chemin.length === 0 ? taches.get(nom) ?? null : null
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr', {numeric: true}));
  return {dossiers, fichiers: ici};
}

/** Le répertoire du dossier `chemin` dans l'arborescence ; null s'il n'existe plus. */
export function repertoireA(racine: Repertoire | null | undefined, chemin: string[]): Repertoire | null {
  let noeud: Repertoire | null | undefined = racine;
  for (const nom of chemin) {
    noeud = (noeud?.repertoires ?? []).find(r => r.type === 'directory' && String(r.fileName ?? '') === nom);
  }
  return noeud ?? null;
}

function commencePar(dossiers: string[], chemin: string[]): boolean {
  return chemin.length <= dossiers.length && chemin.every((nom, i) => dossiers[i] === nom);
}

/** Icône Font Awesome d'un fichier, d'après son extension. */
export function iconeFichier(extension: string): string {
  switch (extension) {
    case 'pdf': return 'fas fa-file-pdf';
    case 'doc': case 'docx': return 'fas fa-file-word';
    case 'xls': case 'xlsx': case 'csv': return 'fas fa-file-excel';
    case 'ppt': case 'pptx': return 'fas fa-file-powerpoint';
    case 'zip': case 'rar': case '7z': return 'fas fa-file-archive';
    case 'mp3': case 'wav': return 'fas fa-file-audio';
    case 'mp4': case 'avi': case 'mkv': return 'fas fa-file-video';
    case 'png': case 'jpg': case 'jpeg': case 'gif': case 'svg': case 'webp': return 'fas fa-file-image';
    case 'dwg': case 'dxf': return 'fas fa-drafting-compass';
    default: return 'fas fa-file';
  }
}

function sansAccents(texte: string): string {
  return texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
