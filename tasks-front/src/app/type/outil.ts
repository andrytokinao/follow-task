import {User} from "./issue";

/*
 * Menu Outils (DT-019) : logiciels, modèles de document, tutoriels vidéo et
 * liens, rangés comme des dossiers. Chaque type est un dossier racine fixe.
 */

export type TypeOutil = 'LOGICIEL' | 'MODELE_DOCUMENT' | 'TUTORIEL_VIDEO' | 'LIEN';
export type PorteeOutil = 'TOUS_LES_ESPACES' | 'ESPACE';

/** Ce que l'écran sait d'un type : son dossier racine et ce qu'un outil de ce type demande. */
export interface DefinitionTypeOutil {
  type: TypeOutil;
  /** Nom du dossier racine. */
  libelle: string;
  /** Un outil de ce type : « un logiciel ». */
  unOutil: string;
  icone: string;
  couleur: string;
  /** Champ « Version » proposé. */
  version: boolean;
  /** Lien : obligatoire, facultatif ou absent. */
  lien: 'obligatoire' | 'facultatif' | 'absent';
  /** Fichiers proposés à la création. */
  fichiers: boolean;
}

export const TYPES_OUTIL: readonly DefinitionTypeOutil[] = [
  {type: 'LOGICIEL', libelle: 'Logiciels', unOutil: 'un logiciel', icone: 'fas fa-compact-disc', couleur: '#2563eb',
    version: true, lien: 'facultatif', fichiers: true},
  {type: 'MODELE_DOCUMENT', libelle: 'Modèles de document', unOutil: 'un modèle', icone: 'fas fa-file-signature', couleur: '#059669',
    version: true, lien: 'absent', fichiers: true},
  {type: 'TUTORIEL_VIDEO', libelle: 'Tutoriels vidéo', unOutil: 'un tutoriel', icone: 'fas fa-circle-play', couleur: '#dc2626',
    version: false, lien: 'facultatif', fichiers: true},
  {type: 'LIEN', libelle: 'Liens', unOutil: 'un lien', icone: 'fas fa-link', couleur: '#7c3aed',
    version: false, lien: 'obligatoire', fichiers: false},
];

export function definitionType(type: TypeOutil | null | undefined): DefinitionTypeOutil | undefined {
  return TYPES_OUTIL.find(d => d.type === type);
}

/** Valeur d'URL d'un type (`logiciel`, `modele-document`...) et retour. */
export function typeVersUrl(type: TypeOutil): string {
  return type.toLowerCase().replace(/_/g, '-');
}

export function typeDepuisUrl(segment: string | null | undefined): TypeOutil | undefined {
  const type = (segment ?? '').toUpperCase().replace(/-/g, '_');
  return definitionType(type as TypeOutil)?.type;
}

export interface DossierOutil {
  id: number;
  nom: string;
  typeOutil: TypeOutil;
  portee: PorteeOutil;
  parentId?: number | null;
  espaceNom?: string | null;
  auteur?: User;
  dateCreation?: string;
  modifiable: boolean;
}

export interface FichierOutil {
  id: number;
  nom: string;
  typeMime?: string;
  taille: number;
  auteur?: User;
  dateAjout?: string;
  supprimable: boolean;
}

export interface Outil {
  id: number;
  titre: string;
  description?: string | null;
  typeOutil: TypeOutil;
  portee: PorteeOutil;
  dossierId?: number | null;
  /** « Sécurité › Antivirus » ; vide à la racine du type. */
  chemin: string;
  url?: string | null;
  version?: string | null;
  /** Classe Font Awesome choisie (« fab fa-windows ») ; null : l'icône du type. */
  icone?: string | null;
  espaceNom?: string | null;
  auteur?: User;
  dateCreation?: string;
  dateModification?: string | null;
  fichiers: FichierOutil[];
  modifiable: boolean;
}

export interface ContenuDossierOutil {
  typeOutil: TypeOutil;
  dossier?: DossierOutil | null;
  chemin: DossierOutil[];
  dossiers: DossierOutil[];
  outils: Outil[];
  peutCreerDossier: boolean;
}

export interface RegleFichiersOutil {
  typeOutil: TypeOutil;
  extensions: string[];
  tailleMax: number;
}

export interface DossierOutilSaisie {
  id?: number | null;
  nom: string;
  typeOutil?: TypeOutil;
  portee?: PorteeOutil;
  parentId?: number | null;
}

export interface OutilSaisie {
  id?: number | null;
  titre: string;
  description?: string | null;
  typeOutil?: TypeOutil;
  portee?: PorteeOutil;
  dossierId?: number | null;
  url?: string | null;
  version?: string | null;
  /** Vide : l'icône du type. */
  icone?: string | null;
}
