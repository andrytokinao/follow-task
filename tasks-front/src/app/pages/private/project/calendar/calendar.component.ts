// calendar.component.ts
import { Component } from '@angular/core';

interface CalendarCell {
  number: number;
  faded: boolean;
  today: boolean;
}

@Component({
  standalone: false,
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent {

  /** Labels des jours de la semaine affichés dans l'en-tête fantôme */
  days: string[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  /** Grille de cellules fantômes représentant un mois type (5 semaines × 7 jours) */
  cells: CalendarCell[] = this.buildGhostCells();

  /**
   * Construit une grille de 35 cellules (5 semaines) pour le mois courant.
   * Les jours hors du mois sont marqués comme "faded".
   * Le jour courant est marqué comme "today".
   */
  private buildGhostCells(): CalendarCell[] {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    // Premier jour du mois (0=dim, ajusté à lun=0)
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = (firstDay === 0 ? 6 : firstDay - 1);

    // Nombre de jours dans le mois
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: CalendarCell[] = [];

    // Jours du mois précédent (faded)
    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push({ number: daysInPrevMonth - i, faded: true, today: false });
    }

    // Jours du mois courant
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ number: d, faded: false, today: d === today });
    }

    // Jours du mois suivant pour compléter la grille à 35 cellules
    let nextDay = 1;
    while (cells.length < 35) {
      cells.push({ number: nextDay++, faded: true, today: false });
    }

    return cells;
  }
}
