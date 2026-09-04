import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {IssueService} from '../../../../services/issue.service';
import {RapportService} from '../../../../services/rapport.service';
import {Project} from '../../../../type/issue';
import {
  DemandeRapport,
  OptionEquipe,
  OptionPersonne,
  OptionProjet,
  OptionsRapport,
  RapportCompositeDTO
} from '../../../../type/rapport';

/**
 * Création d'un rapport sur l'espace de travail.
 *
 * <p>Le rapport n'a pas de type : il a un contenu. On choisit ce qui doit y
 * figurer — des projets, des personnes, des équipes — et le document se compose
 * de ces parties. C'est la même règle côté serveur : une section n'existe que
 * si quelque chose a été sélectionné pour elle.</p>
 *
 * <p>L'aperçu et le PDF viennent tous deux du serveur, à partir de la même
 * sélection : le document imprimé ne peut donc pas dire autre chose que ce qui
 * a été relu à l'écran.</p>
 */
@Component({
  standalone: false,
  selector: 'app-rapport',
  templateUrl: './rapport.component.html',
  styleUrl: './rapport.component.css'
})
export class RapportComponent implements OnInit, OnDestroy {

  project?: Project;
  options?: OptionsRapport;

  chargementOptions = false;
  erreurOptions?: string;

  /** Intitulé libre ; à défaut, le serveur en compose un à partir du contenu. */
  titre = '';

  projetsRetenus = new Set<number>();
  personnesRetenues = new Set<string>();
  equipesRetenues = new Set<number>();

  /**
   * Le rapport par personne est une option et non le mode par défaut : sur la
   * plupart des espaces de travail, un rapport porte sur des projets, et la
   * liste des intervenants encombrerait le formulaire sans être utilisée.
   */
  inclurePersonnes = false;

  rechercheProjet = '';
  recherchePersonne = '';

  rapport?: RapportCompositeDTO;
  generation = false;
  telechargement = false;
  erreur?: string;

  private abonnement?: Subscription;

  constructor(private issueService: IssueService,
              private rapportService: RapportService) {
  }

  ngOnInit(): void {
    this.abonnement = this.issueService.project$.subscribe(project => {
      if (project?.id != null && project.id !== this.project?.id) {
        this.project = project;
        // Changer d'espace de travail invalide la sélection : ses projets et
        // ses membres ne sont pas ceux du précédent.
        this.reinitialiser();
        this.chargerOptions(Number(project.id));
      }
    });
  }

  ngOnDestroy(): void {
    this.abonnement?.unsubscribe();
  }

  // ------------------------------------------------------------------
  // Sélection
  // ------------------------------------------------------------------

  projetsAffiches(): OptionProjet[] {
    return this.filtrer(this.options?.projets ?? [], this.rechercheProjet,
      projet => `${projet.cle ?? ''} ${projet.titre ?? ''}`);
  }

  personnesAffichees(): OptionPersonne[] {
    return this.filtrer(this.options?.personnes ?? [], this.recherchePersonne,
      personne => `${personne.nom ?? ''} ${personne.username ?? ''} ${personne.email ?? ''}`);
  }

  basculerProjet(projet: OptionProjet): void {
    this.basculer(this.projetsRetenus, projet.id);
  }

  basculerPersonne(personne: OptionPersonne): void {
    this.basculer(this.personnesRetenues, personne.id);
  }

  basculerEquipe(equipe: OptionEquipe): void {
    this.basculer(this.equipesRetenues, equipe.id);
  }

  /**
   * Ajoute les membres d'une équipe à la sélection des personnes.
   *
   * Distinct du fait de retenir l'équipe : une équipe donne une section avec sa
   * propre synthèse, ses membres ajoutés individuellement figurent dans la
   * partie « par personne ». Les deux se choisissent séparément.
   */
  ajouterMembres(equipe: OptionEquipe): void {
    equipe.membreIds.forEach(id => this.personnesRetenues.add(id));
    if (equipe.membreIds.length) {
      this.inclurePersonnes = true;
    }
  }

  /** Les projets visibles, c'est-à-dire ceux que la recherche laisse voir. */
  toutSelectionnerProjets(): void {
    this.projetsAffiches().forEach(projet => this.projetsRetenus.add(projet.id));
  }

  aucunProjet(): void {
    this.projetsRetenus.clear();
  }

  toutSelectionnerPersonnes(): void {
    this.personnesAffichees().forEach(personne => this.personnesRetenues.add(personne.id));
  }

  aucunePersonne(): void {
    this.personnesRetenues.clear();
  }

  /**
   * Décocher l'option vide la sélection des personnes : la laisser en place
   * ferait réapparaître d'anciens choix à la case suivante sans prévenir.
   */
  basculerOptionPersonnes(): void {
    this.inclurePersonnes = !this.inclurePersonnes;
    if (!this.inclurePersonnes) {
      this.personnesRetenues.clear();
    }
  }

  get selectionVide(): boolean {
    return this.projetsRetenus.size === 0
      && this.equipesRetenues.size === 0
      && !(this.inclurePersonnes && this.personnesRetenues.size > 0);
  }

  // ------------------------------------------------------------------
  // Édition du rapport
  // ------------------------------------------------------------------

  generer(): void {
    if (this.selectionVide || !this.project?.id) {
      return;
    }
    this.generation = true;
    this.erreur = undefined;

    this.rapportService.genererComposite(this.demande()).subscribe({
      next: rapport => {
        this.rapport = rapport;
        this.generation = false;
      },
      error: erreur => {
        this.erreur = erreur?.error?.error ?? "Le rapport n'a pas pu être généré.";
        this.rapport = undefined;
        this.generation = false;
      }
    });
  }

  telechargerPdf(): void {
    if (this.selectionVide || !this.project?.id) {
      return;
    }
    this.telechargement = true;
    this.erreur = undefined;

    this.rapportService.telechargerPdfComposite(this.demande()).subscribe({
      next: () => this.telechargement = false,
      error: () => {
        // La réponse d'erreur d'un téléchargement est un blob, pas le
        // { error: "..." } habituel : son message n'est pas lisible ici.
        this.erreur = "Le PDF n'a pas pu être généré.";
        this.telechargement = false;
      }
    });
  }

  // ------------------------------------------------------------------
  // Interne
  // ------------------------------------------------------------------

  private demande(): DemandeRapport {
    return {
      // `Project.id` est déclaré `Number` (objet) dans le modèle du front :
      // le DTO du serveur attend un nombre primitif.
      projectId: Number(this.project!.id),
      titre: this.titre.trim() || null,
      projetIds: [...this.projetsRetenus],
      personneIds: this.inclurePersonnes ? [...this.personnesRetenues] : [],
      equipeIds: [...this.equipesRetenues]
    };
  }

  private chargerOptions(projectId: number): void {
    this.chargementOptions = true;
    this.erreurOptions = undefined;

    this.rapportService.optionsRapport(projectId).subscribe({
      next: options => {
        this.options = options;
        this.chargementOptions = false;
      },
      error: erreur => {
        this.erreurOptions = erreur?.error?.error
          ?? "Les projets et les membres de l'espace de travail n'ont pas pu être chargés.";
        this.options = undefined;
        this.chargementOptions = false;
      }
    });
  }

  private reinitialiser(): void {
    this.options = undefined;
    this.rapport = undefined;
    this.erreur = undefined;
    this.titre = '';
    this.rechercheProjet = '';
    this.recherchePersonne = '';
    this.inclurePersonnes = false;
    this.projetsRetenus.clear();
    this.personnesRetenues.clear();
    this.equipesRetenues.clear();
  }

  private basculer<T>(selection: Set<T>, valeur: T): void {
    if (selection.has(valeur)) {
      selection.delete(valeur);
    } else {
      selection.add(valeur);
    }
  }

  /** Recherche sans accent ni casse : « Rakoto » doit trouver « rakoto ». */
  // (les marques diacritiques sont retirées après décomposition NFD)
  private filtrer<T>(elements: T[], recherche: string, texte: (element: T) => string): T[] {
    const terme = this.normaliser(recherche);
    if (!terme) {
      return elements;
    }
    return elements.filter(element => this.normaliser(texte(element)).includes(terme));
  }

  private normaliser(valeur: string): string {
    return (valeur ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
}
