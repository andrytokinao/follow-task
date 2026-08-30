import { Component } from '@angular/core';

export interface AdminMenu {
  label: string;
  description: string;
  icon: string;
  route: string;
  /** passer a true pour reafficher l'entree dans le menu lateral */
  visible: boolean;
}

@Component({
  standalone: false,
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  collapsed: boolean = false;

  /**
   * Seule la gestion des utilisateurs est exposee pour l'instant ; les autres
   * entrees restent declarees pour etre reactivees via leur indicateur visible.
   */
  menus: AdminMenu[] = [
    {
      label: 'Gestion des utilisateurs',
      description: 'Comptes, groupes et rôles',
      icon: 'fas fa-users',
      route: 'users',
      visible: true
    },
    {
      label: 'Gestion des groupes',
      description: 'Groupes et accessibilités',
      icon: 'fas fa-user-shield',
      route: 'groups',
      visible: false
    },
    {
      label: 'Configurations',
      description: 'Paramètres de l\'application',
      icon: 'fas fa-cogs',
      route: 'config',
      visible: false
    }
  ];

  get visibleMenus(): AdminMenu[] {
    return this.menus.filter(menu => menu.visible);
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }
}
