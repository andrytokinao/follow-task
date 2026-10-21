import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {ToastrService} from 'ngx-toastr';
import {combineLatest, of, Subject} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, switchMap, takeUntil} from 'rxjs/operators';
import {Project} from '../../../../../type/issue';
import {
  ContenuDossierOutil,
  definitionType,
  DefinitionTypeOutil,
  DossierOutil,
  Outil,
  typeDepuisUrl,
  TYPES_OUTIL,
  typeVersUrl
} from '../../../../../type/outil';
import {extensionFichier, messageErreur} from '../../../../../type/outil.util';
import {iconeFichier} from '../../../../../common/liste-fichiers/fichiers-issue';
import {IssueService} from '../../../../../services/issue.service';
import {OutilService} from '../../../../../services/outil.service';
import {ConfirmationDialogService} from '../../../../../services/confirmation-dialog.service';
import {DossierOutilDialogComponent, DossierOutilDialogData} from '../dossier-outil-dialog/dossier-outil-dialog.component';
import {OutilDialogComponent, OutilDialogData} from '../outil-dialog/outil-dialog.component';
import {OutilFicheData, OutilFicheDialogComponent, SortieFiche} from '../outil-fiche-dialog/outil-fiche-dialog.component';

type Vue = 'grille' | 'liste';

/** L'espace de travail ouvert, tel que le menu Outils s'en sert. */
interface EspaceOuvert {
  id: number;
  nom: string;
  prefixe: string;
}

/**
 * Menu Outils d'un espace de travail (DT-019), affiché comme des dossiers :
 * les types sont les dossiers racines, puis les dossiers créés par les
 * membres, puis les outils. Une recherche montre tout à plat, avec le chemin.
 *
 * L'état est porté par l'URL (`outils/logiciel/12?q=…`) : précédent,
 * suivant et un lien partagé rouvrent le même dossier.
 */
@Component({
  standalone: false,
  selector: 'app-outils-page',
  templateUrl: './outils-page.component.html',
  styleUrl: './outils-page.component.css'
})
export class OutilsPageComponent implements OnInit, OnDestroy {

  private static readonly VUE_KEY = 'outils-vue';
  private static readonly RECHERCHE_MIN = 2;

  protected readonly types = TYPES_OUTIL;
  protected espace?: EspaceOuvert;
  /** Absent : racine du menu, les dossiers des types. */
  protected type?: DefinitionTypeOutil;
  protected contenu?: ContenuDossierOutil;
  protected recherche = '';
  /** Résultats de la recherche ; absent hors recherche. */
  protected resultats?: Outil[];
  protected vue: Vue = (localStorage.getItem(OutilsPageComponent.VUE_KEY) as Vue) || 'grille';
  protected chargement = false;
  protected erreur = '';

  private dossierId: number | null = null;
  private readonly recherche$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly route: ActivatedRoute,
              private readonly router: Router,
              private readonly dialog: MatDialog,
              private readonly toastr: ToastrService,
              private readonly issueService: IssueService,
              private readonly outilService: OutilService,
              private readonly confirmation: ConfirmationDialogService) {
  }

  ngOnInit(): void {
    combineLatest([this.issueService.project$.pipe(filter((p): p is Project => !!p?.id)), this.route.paramMap])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([espace, params]) => {
        this.espace = {id: Number(espace.id), nom: String(espace.name ?? ''), prefixe: String(espace.prefix ?? '')};
        this.type = definitionType(typeDepuisUrl(params.get('type')));
        const dossier = Number(params.get('dossierId'));
        this.dossierId = Number.isInteger(dossier) && dossier > 0 ? dossier : null;
        this.charger();
      });

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(q => {
      const texte = q.get('q') ?? '';
      if (texte !== this.recherche) {
        this.recherche = texte;
      }
      this.recherche$.next(texte);
    });

    this.recherche$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(texte => {
        if (!this.espace || texte.trim().length < OutilsPageComponent.RECHERCHE_MIN) {
          return of(undefined);
        }
        // Une recherche en échec ne coupe pas les suivantes.
        return this.outilService.rechercher(this.espace.id, texte.trim()).pipe(catchError(e => {
          this.erreur = messageErreur(e, 'La recherche a échoué');
          return of([] as Outil[]);
        }));
      }),
      takeUntil(this.destroy$)
    ).subscribe(resultats => this.resultats = resultats);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---- navigation ----

  ouvrirType(type: DefinitionTypeOutil): void {
    this.naviguer([typeVersUrl(type.type)]);
  }

  ouvrirDossier(dossier: DossierOutil): void {
    this.naviguer([typeVersUrl(dossier.typeOutil), String(dossier.id)]);
  }

  /** Fil d'Ariane : null pour la racine du menu, le type seul pour sa racine. */
  remonter(dossier?: DossierOutil | null): void {
    if (!this.type) {
      return;
    }
    if (dossier === null) {
      this.naviguer([]);
    } else if (!dossier) {
      this.naviguer([typeVersUrl(this.type.type)]);
    } else {
      this.ouvrirDossier(dossier);
    }
  }

  chercher(texte: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {q: texte.trim() ? texte : null},
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  changerVue(vue: Vue): void {
    this.vue = vue;
    localStorage.setItem(OutilsPageComponent.VUE_KEY, vue);
  }

  // ---- affichage ----

  protected libelleType(outil: Outil): string {
    return definitionType(outil.typeOutil)?.libelle ?? '';
  }

  protected definitionDe(outil: Outil): DefinitionTypeOutil | undefined {
    return definitionType(outil.typeOutil);
  }

  /** Un seul fichier : son icône dit ce qu'on va télécharger. Sinon, celle du type. */
  protected iconeOutil(outil: Outil): string {
    return outil.fichiers.length === 1
      ? iconeFichier(extensionFichier(outil.fichiers[0].nom))
      : definitionType(outil.typeOutil)?.icone ?? 'fas fa-toolbox';
  }

  protected parId(_: number, element: { id: number }): number {
    return element.id;
  }

  /** Action directe d'une tuile : le lien s'ouvre, le fichier unique se télécharge. */
  protected actionDirecte(outil: Outil): 'lien' | 'fichier' | null {
    if (outil.typeOutil === 'LIEN' && outil.url) {
      return 'lien';
    }
    return outil.fichiers.length === 1 ? 'fichier' : null;
  }

  protected urlFichierUnique(outil: Outil): string {
    return this.outilService.urlFichier(outil.fichiers[0]);
  }

  // ---- création et modification ----

  nouveauDossier(): void {
    if (!this.espace || !this.type) {
      return;
    }
    this.ouvrirDialogueDossier({
      espaceId: this.espace.id, espaceNom: this.espace.nom, typeOutil: this.type.type,
      parent: this.contenu?.dossier ?? null
    });
  }

  renommerDossier(dossier: DossierOutil): void {
    if (!this.espace) {
      return;
    }
    this.ouvrirDialogueDossier({
      espaceId: this.espace.id, espaceNom: this.espace.nom, typeOutil: dossier.typeOutil, dossier
    });
  }

  supprimerDossier(dossier: DossierOutil): void {
    this.confirmation.confirm('Supprimer le dossier', `Supprimer le dossier « ${dossier.nom} » ? Il doit être vide.`,
      'Supprimer', 'Annuler')
      .then(ok => {
        if (!ok || !this.espace) {
          return;
        }
        this.outilService.supprimerDossier(this.espace.id, dossier.id).subscribe({
          next: () => this.charger(),
          error: e => this.toastr.error(messageErreur(e, "Le dossier n'a pas été supprimé"))
        });
      })
      .catch(() => undefined);
  }

  nouvelOutil(): void {
    if (!this.espace || !this.type) {
      return;
    }
    this.ouvrirDialogueOutil({
      espaceId: this.espace.id, espaceNom: this.espace.nom, typeOutil: this.type.type,
      dossier: this.contenu?.dossier ?? null
    });
  }

  ouvrirFiche(outil: Outil): void {
    if (!this.espace) {
      return;
    }
    this.dialog.open<OutilFicheDialogComponent, OutilFicheData, SortieFiche>(OutilFicheDialogComponent, {
      data: {espaceId: this.espace.id, outil},
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: false
    }).afterClosed().subscribe(sortie => {
      if (sortie === 'modifier') {
        this.ouvrirDialogueOutil({
          espaceId: this.espace!.id, espaceNom: this.espace!.nom, typeOutil: outil.typeOutil, outil
        });
      } else if (sortie) {
        this.rafraichir();
      }
    });
  }

  /** Après une écriture : le dossier ouvert, et les résultats de la recherche en cours. */
  rafraichir(): void {
    this.charger();
    const texte = this.recherche.trim();
    if (this.espace && this.resultats && texte.length >= OutilsPageComponent.RECHERCHE_MIN) {
      this.outilService.rechercher(this.espace.id, texte).subscribe(resultats => this.resultats = resultats);
    }
  }

  // ---- interne ----

  private ouvrirDialogueDossier(data: DossierOutilDialogData): void {
    this.dialog.open<DossierOutilDialogComponent, DossierOutilDialogData, DossierOutil>(DossierOutilDialogComponent, {
      data, maxWidth: 'calc(100vw - 32px)'
    }).afterClosed().subscribe(dossier => {
      if (dossier) {
        this.charger();
      }
    });
  }

  private ouvrirDialogueOutil(data: OutilDialogData): void {
    this.dialog.open<OutilDialogComponent, OutilDialogData, Outil>(OutilDialogComponent, {
      data, maxWidth: 'calc(100vw - 32px)', disableClose: true
    }).afterClosed().subscribe(outil => {
      if (outil) {
        this.rafraichir();
      }
    });
  }

  private charger(): void {
    this.erreur = '';
    if (!this.espace || !this.type) {
      this.contenu = undefined;
      return;
    }
    this.chargement = true;
    this.outilService.contenu(this.espace.id, this.type.type, this.dossierId).subscribe({
      next: contenu => {
        this.contenu = contenu;
        this.chargement = false;
      },
      error: e => {
        this.chargement = false;
        this.contenu = undefined;
        this.erreur = messageErreur(e, 'Le dossier n\'a pas pu être ouvert');
      }
    });
  }

  private naviguer(segments: string[]): void {
    if (!this.espace) {
      return;
    }
    this.router.navigate(['/working', this.espace.prefixe, 'outils', ...segments]);
  }
}
