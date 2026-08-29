import {Component, ViewChild, AfterViewInit, Input} from "@angular/core";
import {
  DayPilot,
  DayPilotCalendarComponent,
  DayPilotMonthComponent,
  DayPilotNavigatorComponent
} from "@daypilot/daypilot-lite-angular";
import {EventsService} from "../../../../../services/events.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {NewIssueComponent} from "../../modal/new-issue/new-issue.component";
import {CustomField, EventApp, EventSearchCriteria, Issue, Project, User} from "../../../../../type/issue";
import {AuthService} from "../../../../../services/auth.service";
import {MatCheckboxChange} from "@angular/material/checkbox";
import {stripTypename} from "@apollo/client/utilities";
import {MatTableDataSource} from "@angular/material/table";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {BehaviorSubject, forkJoin} from "rxjs";
import {CustomFilter, IssueSearchCriteriaInput} from "../../../../../type/issue-search-criteria.util";
import {AuthGuard} from "../../../../../services/SystemGuard";
import {ProjectGuard} from "../../../../../services/ProjectGuard";
import {Format} from "@angular-devkit/build-angular/src/builders/extract-i18n/schema";
import {EditEventComponent} from "../../../../../common/edit-event/edit-event.component";
import {MatMenuTrigger} from "@angular/material/menu";

@Component({
  standalone:false,
  selector: 'calendar-planning-component',
  templateUrl:'planning-calendar.component.html',
  styleUrl:'planning-calendar.component.css'
})
export class PlanningCalendarComponent implements AfterViewInit {
  @ViewChild("day") day!: DayPilotCalendarComponent;
  @ViewChild("week") week!: DayPilotCalendarComponent;
  @ViewChild("month") month!: DayPilotMonthComponent;
  @ViewChild("navigator") nav!: DayPilotNavigatorComponent;
  @ViewChild("calendar")
  calendar!: DayPilotCalendarComponent;
  @Input() eventCriteria:EventSearchCriteria={};
  @ViewChild('addPlanningTrigger') addPlanningTrigger: MatMenuTrigger;

  menuX: number = 0;
  menuY: number = 0;
  selectedEvent: any = null;

  events: DayPilot.EventData[] = [];
  parentSelectedId :number = undefined;
  parentSelected:Issue | undefined;
  usersSelected:String[] = [];
  date = DayPilot.Date.today();
  users:User[] = [];
  private resources: any[];

  contextMenu = new DayPilot.Menu({

    items: [
      {
        text: "Delete",
        onClick: args => {
          this.eventService.deleteEvent(args.source.data,this.eventCriteria);
        }
      },

      {
        text: "Edit...",
        onClick: args =>  {
          const mouseEvent = args.originalEvent as MouseEvent;
          this.menuX = mouseEvent.clientX;
          this.menuY = mouseEvent.clientY;
          this.selectedEvent = args.source.data;
          this.eventService.selectEventData(this.selectedEvent);

          setTimeout(() => {
            this.addPlanningTrigger.openMenu();
          }, 0);
        }
      },
      {
        text: "-"
      },
      {
        text: "Red",
        onClick: args => {
          this.eventService.updateBackColor(args.source,EventsService.colors.red,this.eventCriteria);

        }
      },
      {
        text: "Green",
        onClick: args => {
          this.eventService.updateBackColor(args.source,EventsService.colors.green,this.eventCriteria);

        }
      },
      {
        text: "Blue",
        onClick: args => {
          this.eventService.updateBackColor(args.source,EventsService.colors.blue,this.eventCriteria);

        }
      },
      {
        text: "Yellow",
        onClick: args => {
          this.eventService.updateBackColor(args.source,EventsService.colors.yellow,this.eventCriteria);

        }
      },

      {
        text: "Gray",
        onClick: args => {
          this.eventService.updateBackColor(args.source,EventsService.colors.gray,this.eventCriteria);
        }
      }
    ]
  });

  // Paliers de densité d'affichage. On agit sur les dimensions natives de
  // DayPilot (cellHeight, hourWidth, headerHeight...) et non sur un
  // `transform: scale()` CSS : un scale garderait la place d'origine dans la
  // page, rendrait le texte flou et fausserait le rendu des événements.
  private static readonly ZOOM_LEVELS = [
    {
      label: 'S',
      cellHeight: 18, hourWidth: 42, headerHeight: 22, resourceHeaderHeight: 64,
      monthCellHeight: 68, eventHeight: 16,
      navCell: 20, navTitleHeight: 22, navDayHeaderHeight: 18,
    },
    {
      label: 'M',
      cellHeight: 24, hourWidth: 50, headerHeight: 26, resourceHeaderHeight: 80,
      monthCellHeight: 88, eventHeight: 20,
      navCell: 23, navTitleHeight: 25, navDayHeaderHeight: 20,
    },
    {
      label: 'L',
      cellHeight: 30, hourWidth: 60, headerHeight: 30, resourceHeaderHeight: 100,
      monthCellHeight: 110, eventHeight: 25,
      navCell: 26, navTitleHeight: 28, navDayHeaderHeight: 22,
    },
  ];

  // Démarre sur le palier compact : l'affichage par défaut de DayPilot est
  // trop haut pour une semaine complète à l'écran.
  zoomIndex = 0;

  configNavigator: DayPilot.NavigatorConfig = {
    locale: PlanningCalendarComponent.LOCALE,
    // Explicite plutôt que "Auto" : navigateur, vue Semaine et vue Mois
    // doivent démarrer sur le même jour, sinon la sélection du navigateur ne
    // correspond pas à la semaine affichée.
    weekStarts: 1,
    showMonths: 1,
    cellWidth: 23,
    cellHeight: 25,
    onVisibleRangeChanged: (args) => {;
     this.loadEvents();
    },
    onTimeRangeSelected: (args) => {
      this.eventCriteria.start = args.start.toString();
      this.eventCriteria.end = args.end.toString();
      this.eventService.searchEventsAndSet(this.eventCriteria);
    },
  };
  private user: User;
  private project: Project;
  private selectedCustomFields: number[] = [];
  private resizeEvent(args: any){
    this.eventService.resizeEventAndLoad(args,this.eventCriteria);
  }
  private moveEvent(args:any){
    this.eventService.resizeEventAndLoad(args,this.eventCriteria);
  }

  selectTomorrow() {
    this.date = DayPilot.Date.today().addDays(1);
  }

  changeDate(date: DayPilot.Date): void {
    this.configDay.startDate = date;
    this.configWeek.startDate = date;
    this.configMonth.startDate = date;
    this.configResource.startDate = date;
  }

  // Locale française fournie en standard par DayPilot : noms de jours/mois en
  // français, horloge 24 h et semaine démarrant le lundi (au lieu du format
  // US par défaut : "8/30/2026" et AM/PM).
  private static readonly LOCALE = 'fr-fr';

  configDay: DayPilot.CalendarConfig = {
    locale: PlanningCalendarComponent.LOCALE,
    timeFormat: "Clock24Hours",
    // Une seule colonne : on peut se permettre le format long.
    headerDateFormat: "dddd d MMMM",
    durationBarVisible: true,
    contextMenu: this.contextMenu,
    onTimeRangeSelected: this.newEvent.bind(this),
    heightSpec:"BusinessHours",
    businessBeginsHour:6,
    businessEndsHour:20,
    onBeforeEventRender: function (args) {
      args.data.html = args.data.html ;
    },
    onBeforeCellRender: (args: any) => {
      args.cell.backColor = "#FF0000";
    },
    onEventClick:(args)=> this.viewEvent(args),
    onEventResize: (args) => this.resizeEvent(args),
    onEventMove: (args) => this.moveEvent(args),
  };

  configWeek: DayPilot.CalendarConfig = {
    viewType: "Week",
    locale: PlanningCalendarComponent.LOCALE,
    weekStarts: 1,
    // Sept colonnes : format court, sinon les en-têtes sont tronqués au
    // palier de zoom compact.
    headerDateFormat: "ddd d MMM",
    durationBarVisible: true ,
    visible:true,
    heightSpec:"BusinessHours",
    businessBeginsHour:6,
    businessEndsHour:20,
    timeFormat:"Clock24Hours",
    contextMenu: this.contextMenu,
    onTimeRangeSelected: this.newEvent.bind(this),
/*
    onBeforeEventRender: this.onBeforeEventRender.bind(this),
*/
    onEventClick:(args) =>this.viewEvent(args),
    onEventResize: (args) => this.resizeEvent(args),
    onEventMove: (args) => this.moveEvent(args),
    onBeforeCellRender: (args:any) => {
      const now = DayPilot.Date.now();
      if (args.cell.start <= now && now < args.cell.end) {
        args.cell.backColor = "red";
      }
    },

  };

  configMonth: DayPilot.MonthConfig = {
    locale: PlanningCalendarComponent.LOCALE,
    weekStarts: 1,
    contextMenu: this.contextMenu,
    eventBarVisible: false,
    onTimeRangeSelected: this.newEvent.bind(this),
    onEventClick: (args)=>this.viewEvent(args),
    onEventMove: (args) => this.moveEvent(args),

  };
  configResource: DayPilot.CalendarConfig = {
    viewType: "Resources",
    locale: PlanningCalendarComponent.LOCALE,
    timeFormat: "Clock24Hours",
    headerHeight: 100,
    heightSpec:"BusinessHours",
    businessBeginsHour:6,
    businessEndsHour:20,
    onEventResize: (args) => this.resizeEvent(args),
    onEventMove: (args) => this.mouveEventAtResources(args),
    onEventClick:(args)=> this.viewEvent(args),
    onTimeRangeSelected: (args)=>this.newEventForResources(args),
    contextMenu: new DayPilot.Menu({
        items: [

          {
            text: "Edit...",
            onClick: args =>  {
              const mouseEvent = args.originalEvent as MouseEvent;
              this.menuX = mouseEvent.clientX;
              this.menuY = mouseEvent.clientY;
              this.selectedEvent = args.source.data;
              this.eventService.selectEventData(this.selectedEvent);

              setTimeout(() => {
                this.addPlanningTrigger.openMenu();
              }, 0);
            }
          },
          {
            text: "Delete",
            onClick: args => {
              this.eventService.deleteEvent(args.source.data, this.eventCriteria);
            }
          },
          {
            text: "-"
          },
          {
            text: "Red",
            onClick: args => {
              this.eventService.updateBackColor(args.source, EventsService.colors.red, this.eventCriteria);
            }
          },
          {
            text: "Green",
            onClick: args => {
              this.eventService.updateBackColor(args.source, EventsService.colors.green, this.eventCriteria);
            }
          },
          {
            text: "Blue",
            onClick: args => {
              this.eventService.updateBackColor(args.source, EventsService.colors.blue, this.eventCriteria);
            }
          },
          {
            text: "Yellow",
            onClick: args => {
              this.eventService.updateBackColor(args.source, EventsService.colors.yellow, this.eventCriteria);
            }
          },
          {
            text: "Gray",
            onClick: args => {
              this.eventService.updateBackColor(args.source, EventsService.colors.gray, this.eventCriteria);
            }
          }
        ],
      }
    ),
  };
  private masterFilter: CustomFilter = {} ;
  dateCustomFields: CustomField[] = [];

  constructor(
    protected eventService: EventsService,
    private modalService: NgbModal,
    private authService:AuthService,
    private issueService:IssueService,
    private userService:UserService,
    protected authGuard:AuthGuard,
    protected projectGuard:ProjectGuard
) {
/*
    this.viewWeek();
*/
  }

  ngAfterViewInit(): void {
    this.applyZoom();
    this.viewWeek();
    // Ajouter un "fake event" pour l'heure actuelle
    this.addCurrentTimeMarker();

    // Mettre à jour l'heure actuelle chaque minute
    setInterval(() => {
      this.addCurrentTimeMarker();
    }, 60000);
    this.eventService.events$.subscribe(events => {
      this.events = events;
        this.refreshView();
    });
    this.issueService.project$.subscribe(project => {
      this.project = project;
      if (this.project) {
        this.eventCriteria.projectId = this.project.id;
        this.loadEvents();

      }
    });
    this.authService.connectedUser$.subscribe(user => {
      this.user = user;
      this.eventCriteria.userIds = [this.user.id];
      this.loadEvents();
    });

    this.eventService.resources$.subscribe(resources => {
      this.resources = resources;
      this.refreshView();
    })

    this.userService.allMembers$.subscribe((users: any) => {
      this.users = users;
    });
    this.issueService.masterCriteria$.subscribe(criteria => {
      this.masterFilter.criteria = criteria;
    });
    this.issueService.allCustomField$.subscribe(customFields=> {
      this.dateCustomFields = customFields.filter(cf=> (cf.type === 'Date'))
    });
  }

    loadEvents(): void {
    if (!(this.project && this.user))
      return;
    this.eventCriteria.start = this.nav.control.visibleStart().toString();
    this.eventCriteria.end = this.nav.control.visibleEnd().toString();
    this.eventService.searchEventsAndSet(this.eventCriteria);
      this.eventService.loadUserResource();

    }
  viewResources():void {
    this.configNavigator.selectMode = "None";
    this.configDay.visible = false;
    this.configWeek.visible = false;
    this.configMonth.visible = false;
    this.configResource.visible = true;
    this.eventCriteria.userIds = [];
    this.loadEvents();

  }
  viewDay():void {
    this.configNavigator.selectMode = "Day";
    this.configDay.visible = true;
    this.configWeek.visible = false;
    this.configMonth.visible = false;
    this.configResource.visible = false;
    if (this.user) {
      this.eventCriteria.userIds = [this.user.id];
      this.loadEvents();
    }

  }

  viewWeek():void {
    this.configNavigator.selectMode = "Week";
    this.configDay.visible = false;
    this.configWeek.visible = true;
    this.configMonth.visible = false;
    this.configResource.visible = false;
    if (this.user) {
      this.eventCriteria.userIds = [this.user.id];
      this.loadEvents();
    }


  }

  viewMonth():void {
    this.configNavigator.selectMode = "Month";
    this.configDay.visible = false;
    this.configWeek.visible = false;
    this.configMonth.visible = true;
    this.configResource.visible = false;
    if (this.user)
      this.eventCriteria.userIds = [this.user.id];

  }

  onBeforeEventRender(args: any) {
    const dp = args.control;
    args.data.areas = [

    ];

    args.data.areas.push({
      bottom: 5,
      left: 5,
      width: 36,
      height: 36,
      action: "None",
      image: `https://picsum.photos/36/36?random=${args.data.id}`,
      style: "border-radius: 50%; border: 2px solid #fff; overflow: hidden;",
    });
  }

  newEvent(args: any) {
    const newEvent: any = {
      title: "",
      eventType: undefined,
      start: args.start,
      allDay: false,
      customColor: "",
      customStyle: "",
      description: "",
      end: args.end,
      id: undefined,
      issue: undefined,
      location: "",
      reminderOffset: 0,
      reminderTime: "",
      user: this.user
    };
    if (this.parentSelected) {
      newEvent.issue = this.parentSelected;
      this.issueService.loadSubtaskAndSet(this.parentSelectedId);
    }
    this.eventService.newEvent(newEvent).subscribe(res => {
      this.eventCriteria.userIds = [this.user.id];
      this.eventService.searchEventsAndSet(this.eventCriteria);
    });
  }
  newEventForResources(args: any) {
    const newEvent: any = {
      title: "",
      eventType: undefined,
      start: args.start,
      allDay: false,
      customColor: "",
      customStyle: "",
      description: "",
      end: args.end,
      id: undefined,
      issue: undefined,
      location: "",
      reminderOffset: 0,
      reminderTime: "",
      user: undefined
    };
    if (this.parentSelected) {
      newEvent.issue = this.parentSelected;
    }
    this.eventService.newEventForResources(newEvent,args.resource).subscribe(res => {
      this.eventCriteria.userIds = [this.user.id];
      this.eventService.searchEventsAndSet(this.eventCriteria);
    });
  }
  async onEventClick(args: any,criteria:EventSearchCriteria) {
    this.eventService.editDialogAndSet(args,criteria);
  }

  isSelectedUser(id: String) {
     return  this.usersSelected.some(userId => userId === id)
  }

  changeUsersSelected(event: any, id: String) {
    if (event.checked) {
      this.usersSelected.push(id);
    } else {
      this.usersSelected = this.usersSelected.filter(u => u != id);
    }
    this.applyUsersFilter();
  }

  clearSelectedUsers() {
    this.usersSelected = [];
    this.applyUsersFilter();
  }

  private applyUsersFilter() {
    this.eventCriteria.userIds = this.usersSelected;
    this.eventService.searchEventsAndSet(this.eventCriteria);
  }

  // ---------------------------------------------------------------------
  // Zoom / densité d'affichage
  // ---------------------------------------------------------------------

  get zoomLabel(): string {
    return PlanningCalendarComponent.ZOOM_LEVELS[this.zoomIndex].label;
  }

  get canZoomIn(): boolean {
    return this.zoomIndex < PlanningCalendarComponent.ZOOM_LEVELS.length - 1;
  }

  get canZoomOut(): boolean {
    return this.zoomIndex > 0;
  }

  zoomIn(): void {
    if (!this.canZoomIn) return;
    this.zoomIndex++;
    this.applyZoom();
  }

  zoomOut(): void {
    if (!this.canZoomOut) return;
    this.zoomIndex--;
    this.applyZoom();
  }

  // Les composants DayPilot comparent un hash du contenu de `config` à chaque
  // cycle (ngDoCheck) : muter les propriétés en place suffit, pas besoin de
  // recréer les objets.
  private applyZoom(): void {
    const zoom = PlanningCalendarComponent.ZOOM_LEVELS[this.zoomIndex];

    for (const config of [this.configDay, this.configWeek]) {
      config.cellHeight = zoom.cellHeight;
      config.hourWidth = zoom.hourWidth;
      config.headerHeight = zoom.headerHeight;
    }

    this.configResource.cellHeight = zoom.cellHeight;
    this.configResource.hourWidth = zoom.hourWidth;
    // La vue Équipe affiche les noms en en-tête de colonne : elle a besoin de
    // plus de hauteur que les vues Jour/Semaine.
    this.configResource.headerHeight = zoom.resourceHeaderHeight;

    this.configMonth.cellHeight = zoom.monthCellHeight;
    this.configMonth.eventHeight = zoom.eventHeight;
    this.configMonth.headerHeight = zoom.headerHeight;

    this.configNavigator.cellWidth = zoom.navCell;
    this.configNavigator.cellHeight = zoom.navCell;
    this.configNavigator.titleHeight = zoom.navTitleHeight;
    this.configNavigator.dayHeaderHeight = zoom.navDayHeaderHeight;
  }

  // Initiales affichées dans la pastille du menu équipe.
  userInitials(user: User): string {
    const first = user?.firstName?.charAt(0) ?? '';
    const last = user?.lastName?.charAt(0) ?? '';
    const initials = (last + first).trim();
    return initials ? initials.toUpperCase() : '?';
  }
  private mouveEventAtResources(args:any){
    this.eventService.mouveEventAtResources(args,this.eventCriteria);
  }
  refreshView(){
    let resourceSubject = new BehaviorSubject<any[]>([]);
    let resources$ = resourceSubject.asObservable();
    let eventsSubject = new BehaviorSubject<any[]>([]);
    let events$ = eventsSubject.asObservable();
    forkJoin([
      resources$,
      events$
    ]).subscribe(data => {
      const options = {
        columns: data[0],
        events: data[1]
      };
      this.calendar.control.update(options);
    });
    eventsSubject.next(this.events);
    resourceSubject.next(this.resources);
    resourceSubject.complete();
    eventsSubject.complete();
  }
  viewEvent(args:any){
    this.eventService.viewEvent(args.e.data.id).subscribe(result => {
      this.loadEvents();
    })
  }
  detailsIssue(issue:Issue) {
    this.issueService.browsIssueMaster(issue)
  }
  updateCurrentTimeMarker() {
    const marker = document.getElementById('current-time-marker');
    if (!marker) return;

    const now = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const dayLengthInMs = 24 * 60 * 60 * 1000;
    const positionPercentage = ((now.getTime() - startOfDay.getTime()) / dayLengthInMs) * 100;

    // Ajuster la position de la ligne
    marker.style.top = positionPercentage + '%';
  }
  setInterval() {
  this.updateCurrentTimeMarker();
  }
  addCurrentTimeMarker() {
    const now = DayPilot.Date.today().addMilliseconds(new Date().getTime() - new Date().setHours(0, 0, 0, 0));

    // Supprimer l'ancien événement de l'heure actuelle
    this.events = this.events.filter((event) => event.id !== "current-time");

/*    // Ajouter un nouvel événement pour représenter l'heure actuelle
    this.events.push({
      id: "current-time",
      text: "",
      start: now,
      end: now.addMinutes(1),
      cssClass: "current-time-event",
    });*/

    // Rafraîchir le calendrier
    this.configDay = { ...this.configDay };
  }

  isSelectedCustomFieldDate(id: number) {
    return this.selectedCustomFields.some(cf=> cf === id);
  }

  selectField(event: any, dateField: CustomField) {
    if (event.checked) {
      if (!this.selectedCustomFields)
         this.selectedCustomFields = [];
      this.selectedCustomFields.push(dateField.id);
    } else {
      this.selectedCustomFields = this.selectedCustomFields.filter(cf => cf != dateField.id);
    }
    if (this.selectedCustomFields && this.selectedCustomFields.length != 0) {
      this.eventCriteria.customFieldIds = this.selectedCustomFields ;
    } else {
      this.eventCriteria.customFieldIds = [];
    }
    this.loadEvents();
  }

  closeEventForm() {
    this.addPlanningTrigger.closeMenu();
    this.loadEvents();
  }

}

