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
  hoveredParent: number | null = null;

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
        onClick: async args => {
          this.eventService.editDialogAndSet(args.source.data,this.eventCriteria);
        }
      },
      {
        text: "Edit 2...",
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

  configNavigator: DayPilot.NavigatorConfig = {
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

  configDay: DayPilot.CalendarConfig = {
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
    durationBarVisible: true ,
    visible:true,
    heightSpec:"BusinessHours",
    businessBeginsHour:6,
    businessEndsHour:20,
    timeFormat:"Auto",
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
    contextMenu: this.contextMenu,
    eventBarVisible: false,
    onTimeRangeSelected: this.newEvent.bind(this),
    onEventClick: (args)=>this.viewEvent(args),
    onEventMove: (args) => this.moveEvent(args),

  };
  configResource: DayPilot.CalendarConfig = {
    viewType: "Resources",
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
            onClick: async args => {
              this.eventService.editDialogAndSet(args.source.data, this.eventCriteria);
              ;
            }
          },
          {
            text: "Edit 2...",
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
  issueMasters: Issue[]=[];
  private masterFilter: CustomFilter = {} ;
  dateCustomFields: CustomField[] = [];
  curentFilter: CustomFilter ;

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

    this.issueService.issueMasterList$.subscribe((res: any) => {
      this.issueMasters = res;
    });
    this.userService.allMembers$.subscribe((users: any) => {
      this.users = users;
    });
    this.issueService.masterCriteria$.subscribe(criteria => {
      this.masterFilter.criteria = criteria;
    });
    this.issueService.allCustomField$.subscribe(customFields=> {
      this.dateCustomFields = customFields.filter(cf=> (cf.type === 'Date'))
    });
    this.issueService.currentMasterFilter$.subscribe(curentFilter=> {
      this.curentFilter = curentFilter;
    })
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

  isSelectedParent(id: number) {
    return id == this.parentSelectedId;
  }
  changesParents(event: any, issue: Issue) {
    if (event.checked) {
      this.parentSelectedId = issue.id;
      this.parentSelected = issue;
    } else {
      this.parentSelectedId = undefined;
      this.parentSelected = undefined;

    }
    if (this.parentSelectedId != null){
      this.eventCriteria.parrentIds = [this.parentSelectedId];
    } else {
      this.eventCriteria.parrentIds = undefined;
    }
    this.eventService.searchEventsAndSet(this.eventCriteria);
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
    this.eventCriteria.userIds = this.usersSelected;
    this.eventCriteria.userIds = this.usersSelected;
    this.eventService.searchEventsAndSet(this.eventCriteria);
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

