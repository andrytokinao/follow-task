import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatMenuModule} from '@angular/material/menu';
import {Router} from '@angular/router';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Subscription} from 'rxjs';
import {AuthService} from '../../services/auth.service';
import {UserService} from '../../services/user.service';
import {User} from '../../type/issue';
import {UserAvatarComponent} from '../user-avatar/user-avatar.component';
import {ProfileComponent} from '../../pages/private/profile/profile.component';

/**
 * Zone de compte : qui est connecté, accès à son profil, déconnexion.
 *
 * Extraite pour être posée partout où l'utilisateur doit pouvoir se situer et
 * sortir — l'accueil /working n'en avait aucune, on y était connecté sans
 * pouvoir le vérifier ni se déconnecter sans entrer dans un projet.
 *
 * Le panneau du menu est rendu par Angular Material dans un conteneur de
 * surcouche, hors de ce composant : ses styles passent donc par `::ng-deep`,
 * comme dans le reste de l'application.
 */
@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule, MatMenuModule, UserAvatarComponent],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.css'
})
export class UserMenuComponent implements OnInit, OnDestroy {

  /**
   * `ligne` : avatar, nom et sous-titre — pour une barre latérale ou un panneau.
   * `avatar` : l'avatar seul — pour une barre supérieure étroite.
   */
  @Input() variante: 'ligne' | 'avatar' = 'ligne';

  /** Sous-titre de la ligne. L'e-mail identifie la session sans ambiguïté. */
  @Input() sousTitre?: string;

  utilisateur: User | null = null;
  deconnexionEnCours = false;

  private profil: any = null;
  private abonnements = new Subscription();

  constructor(private authService: AuthService,
              protected userService: UserService,
              private modalService: NgbModal,
              private router: Router) {
  }

  ngOnInit(): void {
    this.abonnements.add(
      this.authService.connectedUser$.subscribe(user => this.utilisateur = user));
    this.abonnements.add(
      this.authService.profile$.subscribe(profil => this.profil = profil));
  }

  ngOnDestroy(): void {
    this.abonnements.unsubscribe();
  }

  get nomComplet(): string {
    const nom = `${this.utilisateur?.firstName ?? ''} ${this.utilisateur?.lastName ?? ''}`.trim();
    return nom || this.profil?.username || 'Utilisateur';
  }

  get ligneSecondaire(): string {
    return this.sousTitre ?? this.utilisateur?.email?.toString() ?? 'Mon compte';
  }

  get urlPhoto(): string {
    return this.utilisateur ? this.userService.getUrlPhoto(this.utilisateur) : '';
  }

  ouvrirProfil(): void {
    // L'identifiant vient du profil de session : l'utilisateur complet est
    // chargé séparément et peut ne pas être encore arrivé.
    const id = this.profil?.id ?? this.utilisateur?.id;
    if (!id) {
      return;
    }
    const dialogRef = this.modalService.open(ProfileComponent, {
      windowClass: 'xlModal',
      scrollable: true
    });
    dialogRef.componentInstance.loadUser(id);
    dialogRef.componentInstance.action = 'Mon profil';
    dialogRef.componentInstance.loadGroupeMember();
  }

  deconnexion(): void {
    // Garde contre le double clic : la requête de déconnexion invalide la
    // session, la seconde partirait sans jeton et échouerait bruyamment.
    if (this.deconnexionEnCours) {
      return;
    }
    this.deconnexionEnCours = true;

    this.authService.logout().subscribe({
      next: () => {
        this.deconnexionEnCours = false;
        this.router.navigate(['/login']);
      },
      error: () => {
        this.deconnexionEnCours = false;
        alert('Erreur lors de la déconnexion. Réessayez plus tard.');
      }
    });
  }
}
