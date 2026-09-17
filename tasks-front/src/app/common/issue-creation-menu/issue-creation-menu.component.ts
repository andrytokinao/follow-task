import {ChangeDetectorRef, Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {MatMenuTrigger} from '@angular/material/menu';
import {Issue} from '../../type/issue';
import {IssueService} from '../../services/issue.service';
import {DernierPointeurService, PositionMenu} from '../../services/dernier-pointeur.service';

/** Issue qui vient d'être créée, avec le projet qui la contient pour une tâche. */
export interface IssueCreee {
  issue: Issue;
  parent?: Issue;
}

/**
 * Création d'un projet ou d'une tâche, dans un menu à côté du clic.
 *
 * Le formulaire est le formulaire complet, app-new-issue-form : le type de
 * demande y est un choix obligatoire, qu'une création sur simple titre
 * trancherait à l'aveugle. C'est aussi lui qui, pour une tâche, demande
 * ensuite si on se l'assigne — comme partout ailleurs.
 *
 * Partagé par les écrans qui laissent choisir une issue et doivent permettre
 * de créer celle qu'on n'y trouve pas — le formulaire d'événement et la
 * messagerie, via les demandes émises par issue-picker-menu. Chacun décide
 * ensuite quoi faire de l'issue créée : la sélectionner, la lier à des
 * messages...
 *
 * Le droit de créer un projet n'est pas vérifié ici : le sélecteur n'offre le
 * lien qu'aux gestionnaires de projet et aux administrateurs.
 */
@Component({
  standalone: false,
  selector: 'app-issue-creation-menu',
  templateUrl: './issue-creation-menu.component.html',
  styleUrl: './issue-creation-menu.component.css'
})
export class IssueCreationMenuComponent {

  /**
   * Émis dès l'enregistrement, avant la question d'assignation : l'hôte n'a
   * pas à attendre la réponse, et fermer le panneau sans répondre ne doit pas
   * faire perdre la création.
   */
  @Output() creee = new EventEmitter<IssueCreee>();

  @ViewChild(MatMenuTrigger) private trigger!: MatMenuTrigger;

  /** Projet dans lequel on crée une tâche ; absent pour créer un projet. */
  parent?: Issue;

  x = 0;
  y = 0;

  constructor(private pointeur: DernierPointeurService,
              private issueService: IssueService,
              private cdr: ChangeDetectorRef) {
  }

  /**
   * @param parent   projet où créer une tâche ; absent pour créer un projet
   * @param position à défaut, le dernier clic — celui qui a demandé la création
   */
  ouvrir(parent?: Issue, position?: PositionMenu | MouseEvent): void {
    const cible = this.pointeur.resoudre(position);
    // Le sélecteur qui a demandé la création finit de se fermer : ouvrir tout
    // de suite superposerait les deux panneaux.
    setTimeout(() => {
      if (this.trigger.menuOpen) {
        this.trigger.closeMenu();
      }
      this.parent = parent;
      this.x = cible.x;
      this.y = cible.y;
      // Ancre à sa nouvelle place avant que l'overlay calcule la position.
      this.cdr.detectChanges();
      this.trigger.openMenu();
    });
  }

  fermer(): void {
    this.trigger?.closeMenu();
  }

  /**
   * Une tâche créée apparaît tout de suite dans son projet, sans attendre le
   * rechargement de la liste — qui met ensuite toute l'application à jour.
   * Le menu reste ouvert : pour une tâche, le formulaire pose encore la
   * question d'assignation, et signale la fin par `termine`.
   */
  onSaved(cree: Issue): void {
    if (!cree?.id) {
      return;
    }
    const parent = this.parent;
    if (parent) {
      parent.children = [...(parent.children ?? []), cree];
    }
    this.issueService.refreshIssueListMasters();
    this.creee.emit({issue: cree, parent});
  }

  /** Fin du parcours (réponse donnée, ou projet créé) : la liste montre l'assignation. */
  onTermine(): void {
    this.fermer();
    this.issueService.refreshIssueListMasters();
  }
}
