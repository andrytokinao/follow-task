import {Component, OnInit, ViewChild} from '@angular/core';
import {EventSearchCriteria, Issue, User} from "../../../../../type/issue";
import {DayPilot, DayPilotNavigatorComponent} from "@daypilot/daypilot-lite-angular";
import {EventsService} from "../../../../../services/events.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import Date = DayPilot.Date;

@Component({
  standalone:false,
  selector: 'app-planning-issue',
  templateUrl: './planning-issue.component.html',
  styleUrl: './planning-issue.component.css'
})
export class PlanningIssueComponent implements OnInit{
  issue:Issue;
  events: DayPilot.EventData[] = [];
  @ViewChild("navigator") nav!: DayPilotNavigatorComponent;

  constructor(
    public activeModal: NgbActiveModal,
    public issueService:IssueService,
    public userService:UserService,
    private authService:AuthService,
    private eventService:EventsService
  ) {}
  private contextMenu: DayPilot.Menu =  new DayPilot.Menu({
    items: [
      {
        text: "Edit...",
        onClick: async args => {
          this.editDialog(args.source.data);
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
  });
  configWeek: DayPilot.CalendarConfig = {
    viewType: "Week",
    durationBarVisible: true ,
    visible:true,
    businessBeginsHour:7,
    businessEndsHour: 17,
    contextMenu: this.contextMenu,
    onTimeRangeSelected: this.onTimeRangeSelected.bind(this),
    onBeforeEventRender: function (args) {
      args.data.html = args.data.html || args.data.text;
    },
    onEventClick:(args) =>this.editEvent(args),
    onEventResize: (args) => this.resizeEvent(args),
    onEventMove: (args) => this.moveEvent(args),

  };
  user:User;
  eventCriteria:EventSearchCriteria={};
  configDay: DayPilot.CalendarConfig = {
    durationBarVisible: false,
    contextMenu: this.contextMenu,
    onTimeRangeSelected: this.onTimeRangeSelected.bind(this),
    onBeforeEventRender: function (args) {
      args.data.html = args.data.html || args.data.text;
    },
    onEventClick:(args)=>  this.editEvent(args),
    onEventResize: (args) => this.resizeEvent(args),
    onEventMove: (args) => this.moveEvent(args),
  };

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
  date: DayPilot.Date;
  async onTimeRangeSelected(args: any) {
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
      issue: this.issue,
      location: "",
      reminderOffset: 0,
      reminderTime: "",
      user: this.user
    };
    this.issueService.setSubtask([this.issue]);
    this.eventService.newEvent(newEvent).subscribe(res => {
      this.eventCriteria.issueIds = [this.issue.id];
      console.debug(res);
      this.loadEvents();
    });
  }
  viewEvent(args:any){
    this.eventService.viewEvent(args.e.data.id).subscribe(result => {
      console.debug(result);
    })
  }
  selectNextWeek() {
    this.changeDate(this.date.addDays(7));
  }
  selectLastWeek() {
    this.changeDate(this.date.addDays(-7));
  }
  private resizeEvent(args: any){
    this.eventService.resizeEvent(args).subscribe(ev => {
      this.loadEvents();
    });
  }
  private moveEvent(args:any){
    this.eventService.resizeEvent(args).subscribe(ev => {
      this.loadEvents();
    });
  }

  private editEvent(args:any) {
    this.eventService.editDialog(args.e.data).subscribe( res => {
      this.loadEvents();
    })
  }
  loadEvents() {
    if (this.nav) {
      this.eventCriteria.start = this.nav.control.visibleStart().toString();
      this.eventCriteria.end = this.nav.control.visibleEnd().toString();
    }
    this.eventCriteria.parrentIds = [this.issue.id];
    this.eventService.searchEvents(this.eventCriteria).subscribe(events => {
      this.events = this.eventService.toEventDataList(events);
    });
  }

  ngOnInit(): void {
    this.loadEvents();
    this.configNavigator.selectMode = "Week";
    this.date = DayPilot.Date.today();

  }

  changeDate(date: DayPilot.Date): void {
    console.debug(date);
    this.configDay.startDate = date;
    this.configWeek.startDate = date;
    this.date = date;
    this.loadEvents();
  }

  private editDialog(data) {
    this.eventService.editDialog(data).subscribe(event => {
      this.loadEvents();
    })
  };
  private loadSubTask(){

  }
}
