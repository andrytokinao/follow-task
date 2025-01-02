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
import {EventApp, EventSearchCriteria, Issue, User} from "../../../../../type/issue";
import {AuthService} from "../../../../../services/auth.service";
import {MatCheckboxChange} from "@angular/material/checkbox";
import {stripTypename} from "@apollo/client/utilities";
import {MatTableDataSource} from "@angular/material/table";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {BehaviorSubject, forkJoin} from "rxjs";
import {IssueSearchCriteriaInput} from "../../../../../type/issue-search-criteria.util";
import {AuthGuard} from "../../../../../services/SystemGuard";
import {ProjectGuard} from "../../../../../services/ProjectGuard";

@Component({
  selector: 'calendar-planning-component',
  template: `
    <div class="contenue">
      <div class="navigator">
        <daypilot-navigator [config]="configNavigator" [events]="events" [(date)]="date" (dateChange)="changeDate($event)" #navigator></daypilot-navigator>
       <div >
         <form class="card" style="margin-top: 15px;padding-top: 5px;padding-bottom: 5px" >
           <h1> Projets <i class="fas fa-edit" (click)="editFilterMaster()"></i></h1>
           <div class="sidebar-heding ">
             <div *ngFor="let parent of issueMasters">
               <mat-checkbox
                 [checked]="isSelectedParent(parent.id)"
                 (change)="changesParents($event,parent)"
               >
                 {{ parent.issueKey +' '+parent.summary }}
               </mat-checkbox>
               <i class="fas fa-d-and-d-beyond" (click)="detailsIssue(parent)"> </i>
             </div>
           </div>
         </form>
       </div>
        <form class="card" style="margin-top: 15px;padding-top: 5px;padding-bottom: 5px">
          <h1> Equipe </h1>
          <div class="sidebar-heding ">
            <div *ngFor="let user of users" [class]="isSelectedUser(user.id) ? 'selected' : ''">
              <mat-checkbox
                [checked]="isSelectedUser(user.id)"
                (change)="changeUsersSelected($event,user.id)"
              >
                {{ user.lastName +' '+user.firstName }}
              </mat-checkbox>
            </div>
          </div>
        </form>
        </div>

      <div class="my-content">
        <span class="selected-date" > <b> {{this.navigator.date.toDate() | date}} </b></span>

        <div class="buttons">
          <button (click)="viewResources()" *ngIf="projectGuard.hasCredential(['CAN_VIEW_TEAM_AGENDA']) | async" [class]="this.configNavigator.selectMode == 'None' ? 'selected' : ''">Equipe</button>
          <button (click)="viewDay()" [class]="this.configNavigator.selectMode == 'Day' ? 'selected' : ''">Day</button>
          <button (click)="viewWeek()" [class]="this.configNavigator.selectMode == 'Week' ? 'selected' : ''">Week</button>
          <button (click)="viewMonth()" [class]="this.configNavigator.selectMode == 'Month' ? 'selected' : ''">Month</button>
        </div>

        <daypilot-calendar [config]="configDay" [events]="events" #day></daypilot-calendar>
        <daypilot-calendar [config]="configWeek" [events]="events" #week></daypilot-calendar>
        <daypilot-month [config]="configMonth" [events]="events" #month></daypilot-month>
        <daypilot-calendar [config]="configResource" #calendar></daypilot-calendar>
      </div>
    </div>

  `,
  styles: [`
    .contenue {
      display: grid;
      grid-template-columns: 1fr 3fr;
    }

    .navigator {
      margin-right: 10px;
    }

    .my-content {
      flex-grow: 1;
    }

    .buttons {
      margin-bottom: 10px;
      display: inline-flex;
    }

    button {
      background-color: #3c78d8;
      color: white;
      border: 0;
      padding: .5rem 1rem;
      width: 80px;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      margin-right: 1px;
      transition: all 0.2s;
      box-shadow: 0 4px 6px rgba(0,0,0,0.08);
      box-sizing: border-box;
    }

    button:last-child {
      margin-right: 0;
    }

    button.selected {
      background-color: #1c4587;
      box-shadow: 0 3px 5px rgba(0,0,0,0.1);
    }
    selected{
      background-color: #1c4587;
    }
    button:first-child {
      border-top-left-radius: 30px;
      border-bottom-left-radius: 30px;
    }

    button:last-child {
      border-top-right-radius: 30px;
      border-bottom-right-radius: 30px;
    }

    button:hover {
      background-color: #2f66c4;
      box-shadow: 0 5px 7px rgba(0,0,0,0.1);
    }

    button:active {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .selected-date{
      border-radius: 21px;
      background-color: #aaaaaa;
      padding: 15px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
  `]
})
export class PlanningCalendarComponent implements AfterViewInit {

  @ViewChild("day") day!: DayPilotCalendarComponent;
  @ViewChild("week") week!: DayPilotCalendarComponent;
  @ViewChild("month") month!: DayPilotMonthComponent;
  @ViewChild("navigator") nav!: DayPilotNavigatorComponent;
  @ViewChild("calendar")
  calendar!: DayPilotCalendarComponent;
  @Input() eventCriteria:EventSearchCriteria={};
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
  private masterCriteria: IssueSearchCriteriaInput = {};
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
    durationBarVisible: false,
    contextMenu: this.contextMenu,
    onTimeRangeSelected: this.newEvent.bind(this),
    onBeforeEventRender: function (args) {
      args.data.html = args.data.html || args.data.text;
    },
    onEventClick:(args)=> this.viewEvent(args),
    onEventResize: (args) => this.resizeEvent(args),
    onEventMove: (args) => this.moveEvent(args),
  };

  configWeek: DayPilot.CalendarConfig = {
    viewType: "Week",
    durationBarVisible: true ,
    visible:true,
    businessBeginsHour:7,
    businessEndsHour: 17,
    contextMenu: this.contextMenu,
    onTimeRangeSelected: this.newEvent.bind(this),
    onBeforeEventRender: this.onBeforeEventRender.bind(this),
    onEventClick:(args) =>this.viewEvent(args),
    onEventResize: (args) => this.resizeEvent(args),
    onEventMove: (args) => this.moveEvent(args),

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

    this.eventService.events$.subscribe(events => {
      this.events = events;
      //   this.refreshView();
    })
    this.authService.connectedUser$.subscribe(user => {
      this.user = user;
      //   this.eventCriteria.userIds = [this.user.id];
      this.loadEvents();
    });

    this.eventService.resources$.subscribe(resources => {
      this.resources = resources;
      console.debug(this.resources);
      this.refreshView();
    })

    this.issueService.issueMasters$.subscribe((res: any) => {
      this.issueMasters = res;
    });
    this.userService.users$.subscribe(users => {
      this.users = users;
    })
    this.issueService.masterCriteria$.subscribe(criteria => {
      this.masterCriteria = criteria;
    })

  }

    loadEvents(): void {
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
  }
  viewDay():void {
    this.configNavigator.selectMode = "Day";
    this.configDay.visible = true;
    this.configWeek.visible = false;
    this.configMonth.visible = false;
    this.configResource.visible = false;

  }

  viewWeek():void {
    this.configNavigator.selectMode = "Week";
    this.configDay.visible = false;
    this.configWeek.visible = true;
    this.configMonth.visible = false;
    this.configResource.visible = false;


  }

  viewMonth():void {
    this.configNavigator.selectMode = "Month";
    this.configDay.visible = false;
    this.configWeek.visible = false;
    this.configMonth.visible = true;
    this.configResource.visible = false;

  }

  onBeforeEventRender(args: any) {
    const dp = args.control;
    args.data.areas = [
      {
        top: 3,
        right: 3,
        width: 20,
        height: 20,
        symbol: "/icons/daypilot.svg#minichevron-down-2",
        fontColor: "#fff",
        toolTip: "Show context menu",
        action: "ContextMenu",
      },
      {
        top: 3,
        right: 25,
        width: 20,
        height: 20,
        symbol: "/icons/daypilot.svg#x-circle",
        fontColor: "#fff",
        action: "None",
        toolTip: "Delete event",
        onClick: async (args: any)   => {
          dp.events.remove(args.source);
        }
      }
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
    console.debug(args);
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
    console.debug(this.usersSelected);
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
      console.debug(options);
    });
    eventsSubject.next(this.events);
    resourceSubject.next(this.resources);
    resourceSubject.complete();
    eventsSubject.complete();
  }
  viewEvent(args:any){
    this.eventService.viewEvent(args.e.data.id).subscribe(result => {
      console.debug(result);
      this.loadEvents();
    })
  }

  editFilterMaster() {
    this.issueService.editFilter(this.masterCriteria).subscribe(
      criteria => {
        this.issueService.searchIssues(criteria).subscribe(issues=> {
          this.issueService.setMasters(issues);
          this.issueService.setIssueMasterCriteria(criteria);
        })
      }
    )
  }

  detailsIssue(issue:Issue) {
    this.issueService.browsIssueMaster(issue)
  }
}

