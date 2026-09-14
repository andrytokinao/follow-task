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
 * quelles — pas des événements de planning. Tant que l'utilisateur n'a rien
 * choisi, tous les champs Date du projet sont affichés ; le menu permet ensuite
 * de restreindre à certains champs.
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

  private destroy$ = new Subject<void>();

  mode: 'month' | 'range' = 'month';
  loading = false;
  /** Un appel en échec doit se voir : sinon il ressemble à une période vide. */
  errorMessage = '';

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
  /** Aucun choix enregistré pour ce projet : on affiche tous les champs Date.
   *  Sans ce défaut, le calendrier s'ouvrait vide et semblait ne rien trouver. */
  private useDefaultSelection = true;

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
        // Le flux démarre à vide et ne se remplit qu'au retour du serveur.
        // Élaguer sur cette première valeur effacerait la sélection restaurée
        // juste avant : les cases se décochaient toutes seules et le
        // calendrier restait vide jusqu'à ce qu'on les recoche.
        if (!fields?.length) {
          return;
        }
        this.dateFields = fields.filter(field => field.type === 'Date');
        // Un champ supprimé entre deux visites ne doit pas rester dans la
        // sélection, sinon le serveur cherche des valeurs d'un champ disparu.
        const known = new Set(this.dateFields.map(f => f.id));
        const kept = this.selectedFieldIds.filter(id => known.has(id));
        // Plus aucun champ retenu (ou aucun choix fait) : retour au défaut,
        // plutôt qu'un calendrier vide.
        if (this.useDefaultSelection || !kept.length) {
          this.useDefaultSelection = true;
          this.selectedFieldIds = this.dateFields.map(f => f.id);
          this.load();
          return;
        }
        if (kept.length !== this.selectedFieldIds.length) {
          this.selectedFieldIds = kept;
          this.storeSelection();
          this.load();
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
    let stored: number[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(this.storageKey) ?? '[]');
      stored = Array.isArray(parsed) ? parsed : [];
    } catch {
      stored = [];
    }
    // Une sélection vide enregistrée ne sert à rien : elle laisserait le
    // calendrier vide à chaque visite. On retombe alors sur le défaut.
    this.useDefaultSelection = !stored.length;
    this.selectedFieldIds = this.useDefaultSelection
      ? this.dateFields.map(f => f.id)
      : stored;
  }

  private storeSelection(): void {
    this.useDefaultSelection = false;
    localStorage.setItem(this.storageKey, JSON.stringify(this.selectedFieldIds));
  }

  // -----------------------------------------------------------------------
  // Chargement
  // -----------------------------------------------------------------------

  load(): void {
    if (!this.project) {
      return;
    }
    // Aucun filtre de niveau : une date portée par une sous-tâche est une date
    // du projet au même titre que celle d'une tâche parente. Restreindre aux
    // parentes vidait le calendrier des projets qui datent leurs sous-tâches.
    const criteria: EventSearchCriteria = {
      projectId: this.project.id,
      start: CalendarComponent.toApiDate(this.periodStart),
      end: CalendarComponent.toApiDate(this.periodEnd),
      customFieldIds: this.selectedFieldIds
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
      this.errorMessage = '';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.eventService.projectDateValues(criteria)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: values => {
          this.loading = false;
          // Une valeur sans date exploitable est écartée ici : plus loin, elle
          // ferait échouer la construction de la grille et le mois entier
          // resterait vide.
          this.values = (values ?? []).filter(value => CalendarComponent.isValidDate(value?.date));
          this.events = this.values.map(value => this.toCalendarEvent(value));
          this.agenda = this.buildAgenda(this.values);
        },
        error: () => {
          this.loading = false;
          this.values = [];
          this.events = [];
          this.agenda = [];
          this.errorMessage = 'Les dates n\'ont pas pu être chargées.';
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

  /** Infobulle au survol : la case du mois n'a la place que pour la clé, on
   *  donne ici de quoi reconnaître la tâche sans l'ouvrir. */
  eventTooltip(value: CustomFieldValue | any): string {
    const issue = value?.issue;
    const date = CalendarComponent.parseServerDate(value?.date);
    const lines = [
      [issue?.issueKey, issue?.summary].filter(Boolean).join(' — '),
      `${this.fieldNameOf(value)}${date ? ' : ' + date.toLocaleDateString('fr-FR') : ''}`
    ];
    if (issue?.project?.name) {
      lines.push(`Projet : ${issue.project.name}`);
    }
    if (issue?.parent?.issueKey) {
      lines.push(`Tâche parente : ${[issue.parent.issueKey, issue.parent.summary].filter(Boolean).join(' — ')}`);
    }
    if (issue?.status?.displayName) {
      lines.push(`Statut : ${issue.status.displayName}`);
    }
    const assignees = this.assigneesOf(issue);
    lines.push(`Assigné : ${assignees.length ? assignees.join(', ') : 'personne'}`);
    return lines.filter(Boolean).join('\n');
  }

  /** Les assignés actifs font foi ; `assigne` seul reste pour les tâches
   *  créées avant la gestion des membres. */
  private assigneesOf(issue: Issue | any): string[] {
    const users: any[] = issue?.assignes?.length ? issue.assignes : (issue?.assigne ? [issue.assigne] : []);
    return users
      .map(user => [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username)
      .filter(Boolean);
  }

  eventColor(value: CustomFieldValue | any): string {
    return this.fieldColor(value?.customField?.id);
  }

  private toCalendarEvent(value: CustomFieldValue | any): DayPilot.EventData {
    const start = CalendarComponent.parseServerDate(value.date)!;
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
      toolTip: this.eventTooltip(value),
      issue: value.issue
    } as any;
  }

  private buildAgenda(values: CustomFieldValue[]): AgendaDay[] {
    const byDay = new Map<string, AgendaDay>();
    for (const event of values) {
      const date = CalendarComponent.parseServerDate(event.date)!;
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

  /** Le serveur renvoie la date en texte : rien ne garantit qu'elle se lise. */
  private static isValidDate(value: any): boolean {
    return CalendarComponent.parseServerDate(value) !== null;
  }

  /** Le serveur envoie `yyyy-MM-dd HH:mm:ss.S` (un `Timestamp` Java). Chrome le
   *  lit, Safari et d'autres non : on extrait la date à la main, en heure
   *  locale, et on ne garde que le jour. */
  private static parseServerDate(value: any): Date | null {
    if (value == null) {
      return null;
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
    const date = match
      ? new Date(+match[1], +match[2] - 1, +match[3])
      : new Date(value);
    return isNaN(date.getTime()) ? null : CalendarComponent.startOfDay(date);
  }

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
