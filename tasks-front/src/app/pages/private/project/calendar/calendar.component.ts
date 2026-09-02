import {Component, OnDestroy, OnInit} from '@angular/core';
import {DayPilot} from '@daypilot/daypilot-lite-angular';
import {Subject, takeUntil} from 'rxjs';
import {CustomField, CustomFieldValue, EventSearchCriteria, Issue, Project} from '../../../../type/issue';
import {EventsService} from '../../../../services/events.service';
import {IssueService} from '../../../../services/issue.service';

/** Une journée de l'agenda, en mode Période. */
interface AgendaDay {
  key: string;
  date: Date;
  events: CustomFieldValue[];
}

/**
 * Calendrier du projet : les dates de l'espace de travail sur une période,
 * soit mois par mois, soit entre deux dates choisies.
 *
 * Ce que le calendrier montre, ce sont les valeurs de champ personnalisé de
 * type Date (`DateCustomFieldValue`) rattachées au projet courant, lues telles
 * quelles — pas des événements de planning. Un menu laisse cocher les champs à
 * afficher : les afficher tous d'office noierait le calendrier.
 */
@Component({
  standalone: false,
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit, OnDestroy {

  private static readonly LOCALE = 'fr-fr';
  /** La sélection de champs est une préférence d'affichage, propre au projet. */
  private static readonly FIELDS_KEY = 'calendrier-champs-dates';
  /** Pour l'instant le calendrier ne remonte que les dates des tâches parentes. */
  private static readonly LEVELS = ['PARENT'];

  private destroy$ = new Subject<void>();

  mode: 'month' | 'range' = 'month';
  loading = false;

  /** Mois affiché en mode Mois (toujours le 1er du mois). */
  monthStart: Date = CalendarComponent.startOfMonth(new Date());
  /** Bornes du mode Période, au format `yyyy-MM-dd` des champs date natifs. */
  rangeFrom = CalendarComponent.toInputDate(new Date());
  rangeTo = CalendarComponent.toInputDate(CalendarComponent.addDays(new Date(), 30));

  events: DayPilot.EventData[] = [];
  agenda: AgendaDay[] = [];

  /** Champs personnalisés de type Date du projet. */
  dateFields: CustomField[] = [];
  selectedFieldIds: number[] = [];

  private project: Project | undefined;
  /** Valeurs brutes renvoyées par le serveur, avant mise en forme. */
  private values: CustomFieldValue[] = [];

  configMonth: DayPilot.MonthConfig = {
    locale: CalendarComponent.LOCALE,
    weekStarts: 1,
    eventHeight: 22,
    cellHeight: 96,
    headerHeight: 26,
    eventBarVisible: false,
    onEventClick: args => this.openIssue(args.e.data.issue),
  };

  constructor(
    private eventService: EventsService,
    private issueService: IssueService
  ) {
  }

  ngOnInit(): void {
    this.issueService.project$
      .pipe(takeUntil(this.destroy$))
      .subscribe(project => {
        this.project = project;
        if (project) {
          this.restoreSelection();
          this.load();
        }
      });

    this.issueService.allCustomField$
      .pipe(takeUntil(this.destroy$))
      .subscribe(fields => {
        this.dateFields = (fields ?? []).filter(field => field.type === 'Date');
        // Un champ supprimé entre deux visites ne doit pas rester dans la
        // sélection, sinon le serveur cherche des valeurs d'un champ disparu.
        const known = new Set(this.dateFields.map(f => f.id));
        const kept = this.selectedFieldIds.filter(id => known.has(id));
        if (kept.length !== this.selectedFieldIds.length) {
          this.selectedFieldIds = kept;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -----------------------------------------------------------------------
  // Période affichée
  // -----------------------------------------------------------------------

  get periodStart(): Date {
    return this.mode === 'month'
      ? this.monthStart
      : CalendarComponent.fromInputDate(this.rangeFrom);
  }

  get periodEnd(): Date {
    if (this.mode === 'month') {
      return CalendarComponent.startOfMonth(CalendarComponent.addMonths(this.monthStart, 1));
    }
    // Borne haute inclusive : « au 31 » doit contenir le 31 en entier.
    return CalendarComponent.addDays(CalendarComponent.fromInputDate(this.rangeTo), 1);
  }

  get monthLabel(): string {
    return this.monthStart.toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'});
  }

  setMode(mode: 'month' | 'range'): void {
    if (this.mode === mode) {
      return;
    }
    this.mode = mode;
    this.load();
  }

  previousMonth(): void {
    this.monthStart = CalendarComponent.addMonths(this.monthStart, -1);
    this.load();
  }

  nextMonth(): void {
    this.monthStart = CalendarComponent.addMonths(this.monthStart, 1);
    this.load();
  }

  today(): void {
    this.monthStart = CalendarComponent.startOfMonth(new Date());
    this.load();
  }

  onRangeChange(): void {
    // Bornes inversées : on remet la fin après le début plutôt que d'interroger
    // le serveur sur une période vide.
    if (this.rangeTo < this.rangeFrom) {
      this.rangeTo = this.rangeFrom;
    }
    this.load();
  }

  // -----------------------------------------------------------------------
  // Champs personnalisés à afficher
  // -----------------------------------------------------------------------

  isFieldSelected(id: number): boolean {
    return this.selectedFieldIds.includes(id);
  }

  toggleField(id: number): void {
    this.selectedFieldIds = this.isFieldSelected(id)
      ? this.selectedFieldIds.filter(fieldId => fieldId !== id)
      : [...this.selectedFieldIds, id];
    this.storeSelection();
    this.load();
  }

  clearFields(): void {
    this.selectedFieldIds = [];
    this.storeSelection();
    this.load();
  }

  /** Couleur stable par champ : la même date garde sa teinte d'une vue à l'autre. */
  fieldColor(id: number): string {
    const palette = ['#1565c0', '#2e7d32', '#ef6c00', '#6a1b9a', '#00838f', '#c62828', '#4527a0', '#37474f'];
    const index = this.dateFields.findIndex(field => field.id === id);
    return palette[(index < 0 ? 0 : index) % palette.length];
  }

  private get storageKey(): string {
    return `${CalendarComponent.FIELDS_KEY}:${this.project?.id ?? 'x'}`;
  }

  private restoreSelection(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      this.selectedFieldIds = stored ? JSON.parse(stored) : [];
    } catch {
      this.selectedFieldIds = [];
    }
  }

  private storeSelection(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.selectedFieldIds));
  }

  // -----------------------------------------------------------------------
  // Chargement
  // -----------------------------------------------------------------------

  load(): void {
    if (!this.project) {
      return;
    }
    const criteria: EventSearchCriteria = {
      projectId: this.project.id,
      start: CalendarComponent.toApiDate(this.periodStart),
      end: CalendarComponent.toApiDate(this.periodEnd),
      customFieldIds: this.selectedFieldIds,
      issueTypeLevels: CalendarComponent.LEVELS
    };

    // Avant l'appel : la grille doit suivre la flèche tout de suite, pas au
    // retour du serveur.
    this.configMonth = {
      ...this.configMonth,
      startDate: DayPilot.Date.fromYearMonthDay(
        this.monthStart.getFullYear(), this.monthStart.getMonth() + 1, 1)
    };

    // Aucun champ coché : le serveur renverrait toutes les dates du projet, ce
    // que le menu ne laisse justement pas demander.
    if (!this.selectedFieldIds.length) {
      this.values = [];
      this.events = [];
      this.agenda = [];
      return;
    }

    this.loading = true;
    this.eventService.projectDateValues(criteria)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: values => {
          this.loading = false;
          this.values = values ?? [];
          this.events = this.values.map(value => this.toCalendarEvent(value));
          this.agenda = this.buildAgenda(this.values);
        },
        error: () => {
          this.loading = false;
          this.values = [];
          this.events = [];
          this.agenda = [];
        }
      });
  }

  // -----------------------------------------------------------------------
  // Présentation
  // -----------------------------------------------------------------------

  fieldNameOf(value: CustomFieldValue | any): string {
    return value?.customField?.name ?? '';
  }

  /** « CLE-12 · Échéance » : la clé situe la tâche, le champ dit quelle date
   *  c'est. Le résumé complet est donné à côté dans l'agenda. */
  eventLabel(value: CustomFieldValue | any): string {
    return `${value?.issue?.issueKey ?? ''} · ${this.fieldNameOf(value)}`.trim();
  }

  eventColor(value: CustomFieldValue | any): string {
    return this.fieldColor(value?.customField?.id);
  }

  private toCalendarEvent(value: CustomFieldValue | any): DayPilot.EventData {
    const start = CalendarComponent.startOfDay(new Date(value.date));
    return {
      id: value.id,
      text: this.eventLabel(value),
      start: DayPilot.Date.fromYearMonthDay(
        start.getFullYear(), start.getMonth() + 1, start.getDate()),
      // Une date de champ n'a pas de durée : la journée entière, comme un jalon.
      end: DayPilot.Date.fromYearMonthDay(
        start.getFullYear(), start.getMonth() + 1, start.getDate()).addDays(1),
      backColor: this.eventColor(value),
      fontColor: '#ffffff',
      issue: value.issue
    } as any;
  }

  private buildAgenda(values: CustomFieldValue[]): AgendaDay[] {
    const byDay = new Map<string, AgendaDay>();
    for (const event of values) {
      const date = new Date(event.date as any);
      if (isNaN(date.getTime())) {
        continue;
      }
      const key = CalendarComponent.toInputDate(date);
      if (!byDay.has(key)) {
        byDay.set(key, {key, date: CalendarComponent.startOfDay(date), events: []});
      }
      byDay.get(key)!.events.push(event);
    }
    const days = [...byDay.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
    for (const day of days) {
      // Plusieurs champs peuvent tomber le même jour : on range par nom de
      // champ pour que l'ordre ne dépende pas de celui de la base.
      day.events.sort((a, b) => this.fieldNameOf(a).localeCompare(this.fieldNameOf(b)));
    }
    return days;
  }

  dayLabel(day: AgendaDay): string {
    return day.date.toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});
  }

  openIssue(issue: Issue | any): void {
    if (issue?.id) {
      this.issueService.browsIssueMaster(issue);
    }
  }

  trackByFieldId(index: number, field: CustomField): number {
    return field.id;
  }

  trackByDayKey(index: number, day: AgendaDay): string {
    return day.key;
  }

  // -----------------------------------------------------------------------
  // Dates
  // -----------------------------------------------------------------------

  private static startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private static startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private static addMonths(date: Date, count: number): Date {
    return new Date(date.getFullYear(), date.getMonth() + count, 1);
  }

  private static addDays(date: Date, count: number): Date {
    const copy = CalendarComponent.startOfDay(date);
    copy.setDate(copy.getDate() + count);
    return copy;
  }

  /** `yyyy-MM-dd` construit à la main : `toISOString` bascule en UTC et décale
   *  la date d'un jour pour les fuseaux à l'est de Greenwich. */
  private static toInputDate(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private static fromInputDate(value: string): Date {
    const [year, month, day] = (value ?? '').split('-').map(Number);
    return year ? new Date(year, (month ?? 1) - 1, day ?? 1) : CalendarComponent.startOfDay(new Date());
  }

  /** Le serveur attend un `LocalDateTime` : date locale, sans fuseau. */
  private static toApiDate(date: Date): string {
    return `${CalendarComponent.toInputDate(date)}T00:00:00`;
  }
}
