import {EspaceDirection, ProjetDirection} from '../direction.model';

/** Une ligne « par espace de travail » du tableau de bord de direction. */
export interface SyntheseEspace {
  espace: EspaceDirection;
  /** Projets en cours de l'espace. */
  nombreProjets: number;
  /** Moyenne simple de l'avancement des projets ; 0 sans projet. */
  avancementMoyen: number;
  tachesEnRetard: number;
  /** Projets ayant au moins une tâche en retard. */
  projetsEnRetard: number;
  /** Lien vers les fiches projets de l'espace. */
  lien: string[];
}

/** Une ligne du tableau « tous les projets ». */
export interface LigneProjet {
  projet: ProjetDirection;
  espace: EspaceDirection | null;
  /** Fiches projets de l'espace, ce projet choisi ; null si l'espace est inconnu. */
  lien: string[] | null;
}

/**
 * Projets rangés par espace de travail. Tous les espaces figurent, même sans
 * projet en cours : l'accueil dit aussi où il ne se passe rien.
 */
export function synthetiserParEspace(espaces: EspaceDirection[], projets: ProjetDirection[]): SyntheseEspace[] {
  return espaces.map(espace => {
    const siens = projets.filter(p => appartient(p, espace));
    const avancement = siens.reduce((total, p) => total + p.avancement, 0);
    return {
      espace,
      nombreProjets: siens.length,
      avancementMoyen: siens.length ? Math.round(avancement / siens.length) : 0,
      tachesEnRetard: siens.reduce((total, p) => total + p.tachesEnRetard, 0),
      projetsEnRetard: siens.filter(p => p.tachesEnRetard > 0).length,
      lien: ['/direction', espace.prefixe]
    };
  });
}

/** Tous les projets, par espace puis du plus en retard au moins en retard. */
export function lignesProjets(espaces: EspaceDirection[], projets: ProjetDirection[]): LigneProjet[] {
  const rang = new Map(espaces.map((e, i) => [e.prefixe, i]));
  return projets
    .map(projet => {
      const espace = espaces.find(e => appartient(projet, e)) ?? null;
      return {projet, espace, lien: espace ? ['/direction', espace.prefixe] : null};
    })
    .sort((a, b) =>
      (rang.get(a.espace?.prefixe ?? '') ?? espaces.length) - (rang.get(b.espace?.prefixe ?? '') ?? espaces.length)
      || b.projet.tachesEnRetard - a.projet.tachesEnRetard
      || a.projet.avancement - b.projet.avancement);
}

function appartient(projet: ProjetDirection, espace: EspaceDirection): boolean {
  return projet.prefixeDepartement
    ? projet.prefixeDepartement === espace.prefixe
    : projet.departement === espace.nom;
}
