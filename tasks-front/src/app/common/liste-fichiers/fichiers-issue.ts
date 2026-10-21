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
