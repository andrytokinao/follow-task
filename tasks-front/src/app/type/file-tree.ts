import {FileCategory, getFileTypeInfo, Repertoire} from './issue';

/**
 * Arborescence de fichiers d'une issue, en pattern Composite.
 *
 * Un fichier (feuille) compte pour 1 ; un dossier (composite) additionne ce que
 * comptent ses enfants. Le code appelant interroge n'importe quel nœud de la
 * même façon, sans savoir s'il tient un fichier ou un dossier entier : c'est ce
 * qui permet d'avoir le total de chaque répertoire, sous-dossiers compris, sans
 * écrire de parcours récursif à chaque usage. Les dossiers eux-mêmes ne sont
 * jamais comptés.
 */
export abstract class FileTreeNode {
  protected constructor(readonly name: string, readonly path: string) {
  }

  /** Nombre de fichiers contenus (1 pour un fichier). */
  abstract fileCount(): number;

  /** Nombre de fichiers par type (pdf, images…). */
  abstract countByCategory(): ReadonlyMap<FileCategory, number>;
}

export class FileLeaf extends FileTreeNode {
  private readonly counts: ReadonlyMap<FileCategory, number>;

  constructor(repertoire: Repertoire) {
    super(`${repertoire.fileName ?? ''}`, repertoire.absolutePath ?? '');
    // getFileTypeInfo lit l'extension dans fileName : il ne doit jamais être absent.
    const category = getFileTypeInfo({...repertoire, fileName: this.name}).category;
    this.counts = new Map([[category, 1]]);
  }

  fileCount(): number {
    return 1;
  }

  countByCategory(): ReadonlyMap<FileCategory, number> {
    return this.counts;
  }
}

export class FolderNode extends FileTreeNode {
  // Calculés une fois : l'arborescence ne change pas après construction, et le
  // gabarit Angular relit ces valeurs à chaque détection de changement.
  private cachedCount?: number;
  private cachedCounts?: ReadonlyMap<FileCategory, number>;

  constructor(name: string, path: string, readonly children: FileTreeNode[]) {
    super(name, path);
  }

  get folders(): FolderNode[] {
    return this.children.filter((child): child is FolderNode => child instanceof FolderNode);
  }

  fileCount(): number {
    return this.cachedCount ??= this.children.reduce((sum, child) => sum + child.fileCount(), 0);
  }

  countByCategory(): ReadonlyMap<FileCategory, number> {
    if (!this.cachedCounts) {
      const counts = new Map<FileCategory, number>();
      for (const child of this.children) {
        child.countByCategory().forEach((count, category) =>
          counts.set(category, (counts.get(category) ?? 0) + count));
      }
      this.cachedCounts = counts;
    }
    return this.cachedCounts;
  }
}

/** Construit le composite à partir de la réponse de `api/load-directory`. */
export function buildFileTree(repertoire: Repertoire | null | undefined): FolderNode {
  if (!repertoire) {
    return new FolderNode('', '', []);
  }
  const children = (repertoire.repertoires ?? []).map(child =>
    child.type === 'directory' ? buildFileTree(child) : new FileLeaf(child));
  return new FolderNode(`${repertoire.fileName ?? ''}`, repertoire.absolutePath ?? '', children);
}

/** Libellé et couleur de chaque type, pour les légendes et graphiques. */
export const FILE_CATEGORY_DISPLAY: Record<FileCategory, { label: string; color: string; icon: string }> = {
  folder:  {label: 'Dossiers',  color: '#F59E0B', icon: 'fa-folder'},
  doc:     {label: 'Documents', color: '#3B82F6', icon: 'fa-file-word'},
  xls:     {label: 'Tableurs',  color: '#22C55E', icon: 'fa-file-excel'},
  pdf:     {label: 'PDF',       color: '#A855F7', icon: 'fa-file-pdf'},
  img:     {label: 'Images',    color: '#F59E0B', icon: 'fa-image'},
  code:    {label: 'Code',      color: '#6366F1', icon: 'fa-file-code'},
  video:   {label: 'Vidéos',    color: '#EC4899', icon: 'fa-file-video'},
  audio:   {label: 'Audio',     color: '#14B8A6', icon: 'fa-file-audio'},
  archive: {label: 'Archives',  color: '#78716C', icon: 'fa-file-zipper'},
  txt:     {label: 'Texte',     color: '#6B7280', icon: 'fa-file-lines'},
  unknown: {label: 'Autres',    color: '#9CA3AF', icon: 'fa-file'},
};
