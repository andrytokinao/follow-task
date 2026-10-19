/**
 * Icône du sélecteur, au format enregistré par le serveur (entité Icone).
 * `id` est le caractère Unicode de l'icône : c'est la clé primaire côté
 * serveur, d'où une seule icône par code dans le catalogue.
 */
export interface IconeChoix {
  typeIcone: 'class';
  value: string;
  id: string;
  /** Nom Font Awesome, affiché en info-bulle. */
  nom: string;
  /** Libellé et mots-clés, en minuscules, pour la recherche. */
  recherche: string;
}

export interface CategorieIcones {
  libelle: string;
  icones: IconeChoix[];
}

type DonneesIcone = [string, 's' | 'b', string];

const PREFIXES = {s: 'fa-solid', b: 'fa-brands'};

function versChoix(nom: string, [code, style, recherche]: DonneesIcone): IconeChoix {
  return {
    typeIcone: 'class',
    value: `${PREFIXES[style]} fa-${nom}`,
    id: String.fromCharCode(parseInt(code, 16)),
    nom,
    recherche: `${nom} ${recherche}`
  };
}

/** Catégories prêtes à afficher, une même icône partagée entre ses catégories. */
export function construireCategories(icones: Record<string, DonneesIcone>,
                                     categories: [string, string[]][]): CategorieIcones[] {
  const parNom = new Map<string, IconeChoix>();
  const choix = (nom: string) => {
    if (!parNom.has(nom)) {
      parNom.set(nom, versChoix(nom, icones[nom]));
    }
    return parNom.get(nom)!;
  };
  return categories.map(([libelle, noms]) => ({
    libelle,
    icones: noms.filter(nom => icones[nom]).map(choix)
  }));
}

/** Icônes dont le nom ou un mot-clé contient chacun des mots saisis, sans doublon. */
export function rechercherIcones(categories: CategorieIcones[], saisie: string): IconeChoix[] {
  const mots = saisie.toLowerCase().split(/\s+/).filter(Boolean);
  if (!mots.length) {
    return [];
  }
  const trouvees = new Set<IconeChoix>();
  for (const categorie of categories) {
    for (const icone of categorie.icones) {
      if (mots.every(mot => icone.recherche.includes(mot))) {
        trouvees.add(icone);
      }
    }
  }
  return [...trouvees];
}
