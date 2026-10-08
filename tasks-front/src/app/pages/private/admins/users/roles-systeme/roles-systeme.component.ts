import {Component, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {forkJoin} from 'rxjs';
import {UserService} from '../../../../../services/user.service';
import {RoleApp, User} from '../../../../../type/issue';

/**
 * Rôles système d'un utilisateur (application.yml, system-authorization).
 *
 * <p>Les rôles d'espace de travail n'apparaissent pas ici : ils se règlent dans
 * chaque espace. Le serveur revérifie les droits et refuse qu'un administrateur
 * se retire lui-même SYSTEM_ADMIN — cet écran n'est qu'une commodité.</p>
 */
@Component({
  standalone: false,
  selector: 'app-roles-systeme',
  templateUrl: './roles-systeme.component.html',
  styleUrl: './roles-systeme.component.css'
})
export class RolesSystemeComponent implements OnInit {

  /** Compte visé, renseigné par l'appelant avant l'ouverture. */
  user: User | any = {};

  roles: RoleApp[] = [];
  /** Rôles cochés. */
  selection = new Set<string>();
  /** Rôles au chargement : pour savoir s'il y a quelque chose à enregistrer. */
  private initiaux: string[] = [];

  chargement = true;
  enregistrement = false;
  erreur = '';

  constructor(public activeModal: NgbActiveModal,
              private userService: UserService) {
  }

  ngOnInit(): void {
    forkJoin([
      this.userService.rolesSystemeDisponibles(),
      this.userService.rolesSystemeUtilisateur(this.user.id)
    ]).subscribe({
      next: ([disponibles, actuels]) => {
        this.roles = disponibles;
        this.initiaux = actuels;
        this.selection = new Set(actuels);
        this.chargement = false;
      },
      error: cause => {
        this.erreur = this.message(cause, 'Les rôles système n\'ont pas pu être chargés.');
        this.chargement = false;
      }
    });
  }

  nomComplet(): string {
    const nom = `${this.user?.lastName ?? ''} ${this.user?.firstName ?? ''}`.trim();
    return nom || this.user?.username || 'Utilisateur';
  }

  basculer(role: string): void {
    if (!this.selection.delete(role)) {
      this.selection.add(role);
    }
  }

  /** Rôles encore attribués mais absents de application.yml : affichés pour qu'on puisse les retirer. */
  get rolesInconnus(): string[] {
    return this.initiaux.filter(nom => !this.roles.some(r => r.name === nom));
  }

  get modifie(): boolean {
    return this.selection.size !== this.initiaux.length
      || this.initiaux.some(r => !this.selection.has(r));
  }

  enregistrer(): void {
    if (!this.modifie || this.enregistrement) {
      return;
    }
    this.enregistrement = true;
    this.erreur = '';
    // Les rôles inconnus du serveur seraient refusés : décochés ou non, ils ne repartent pas.
    const roles = [...this.selection].filter(nom => this.roles.some(r => r.name === nom));
    this.userService.definirRolesSysteme(this.user.id, roles).subscribe({
      next: () => this.activeModal.close(true),
      error: cause => {
        this.erreur = this.message(cause, 'Les rôles système n\'ont pas pu être enregistrés.');
        this.enregistrement = false;
      }
    });
  }

  fermer(): void {
    this.activeModal.close(false);
  }

  private message(cause: any, repli: string): string {
    return cause?.graphQLErrors?.[0]?.message || cause?.message || repli;
  }
}
