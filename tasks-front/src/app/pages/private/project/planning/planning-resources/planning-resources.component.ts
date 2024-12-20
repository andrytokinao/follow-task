import {Component, ViewChild, AfterViewInit} from "@angular/core";
import {
  DayPilot,
  DayPilotCalendarComponent,
  DayPilotMonthComponent,
  DayPilotNavigatorComponent
} from "@daypilot/daypilot-lite-angular";
import {BehaviorSubject, filter, forkJoin} from "rxjs";
import {EventsService} from "../../../../../services/events.service";
import {EventApp, EventSearchCriteria} from "../../../../../type/issue";

@Component({
  selector: 'calendar-component-resources',
  template: `
    <div class="contenue">
    <div class="navigator">
      <daypilot-navigator [config]="configNavigator" [events]="events" [(date)]="date" (dateChange)="changeDate($event)" #navigator></daypilot-navigator>
    </div>
      <div class="content">
    <daypilot-calendar [config]="config" #calendar></daypilot-calendar>
      </div>
    </div>
  `,
  styleUrl: './planning-resources.component.css'

})
export class PlanningResourcesComponent implements AfterViewInit {
  date = DayPilot.Date.today();

  configNavigator: DayPilot.NavigatorConfig = {
    showMonths: 3,
    cellWidth: 23,
    cellHeight: 25,
    onVisibleRangeChanged: args => {
      this.eventCriteria.start = args.start.toString();
      this.eventCriteria.end = args.end.toString();
      this.eventService.searchEvents(this.eventCriteria);
    },
    onTimeRangeSelected: (args) => {
    },
  };
  @ViewChild("day") day!: DayPilotCalendarComponent;
  @ViewChild("week") week!: DayPilotCalendarComponent;
  @ViewChild("month") month!: DayPilotMonthComponent;
  @ViewChild("navigator") nav!: DayPilotNavigatorComponent;
  @ViewChild("calendar")
  calendar!: DayPilotCalendarComponent;
  eventCriteria:EventSearchCriteria={};
  config: DayPilot.CalendarConfig = {
    viewType: "Resources",
    headerHeight: 100,
    onEventResize: (args) => this.resizeEvent(args),
    onEventMove:(args) => this.mouveEventAtResources(args),
    onEventClick:(args)=> this.eventService.editDialog(args.e.data,this.eventCriteria),
    onTimeRangeSelected: this.onTimeRangeSelected.bind(this),
    contextMenu: new DayPilot.Menu({
      items: [
        {
          text: "Edit...",
          onClick: async args => {
              this.eventService.editDialog(args.source.data,this.eventCriteria);
            ;
          }
        },
        {
          text: "Delete",
          onClick: args => {
            this.eventService.deleteEvent(args.source.data,this.eventCriteria);
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
      ],
    }
    ),

    onBeforeHeaderRender: args => {
      const data = args.column.data;
      const header = args.header;
      header.verticalAlignment = "top";
      if (data.tags.image) {
        args.header.areas = [
          {
            left: "calc(50% - 30px)",
            bottom: 10,
            height: 60,
            width: 60,
            image: data.tags.image,
            style: "border-radius: 40px; overflow: hidden; border: 3px solid #fff;"
          }
        ];
      }
    },
    onBeforeEventRender: args => {
      args.data.areas = [
        {
          top: 3,
          right: 3,
          width: 24,
          height: 24,
          action: "ContextMenu",
          padding: 2,
          symbol: "/icons/daypilot.svg#threedots-h",
          cssClass: "event-menu",
          toolTip: "Menu"
        }
      ];
    }
  };
  protected events: any[];
  private resources: any[];

  constructor(private eventService: EventsService) {
  }

  ngAfterViewInit(): void {

    this.eventCriteria.start = this.nav.control.visibleStart().toString();
    this.eventCriteria.end = this.nav.control.visibleEnd().toString();;
    this.eventService.searchEvents(this.eventCriteria);
    this.eventService.loadUserResource();
    this.eventService.events$.subscribe(events => {
      this.events = events;
      this.refreshView();
    });
    this.eventService.resources$.subscribe(resources => {
      this.resources = resources;
      this.refreshView();
    })

  }
  onTimeRangeSelected(args: any) {
    console.debug(args);
    const newEvent: EventApp = {
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
      user: this.eventService.getUserByResource(args.resource)
    };
    this.eventService.newEvent(newEvent).subscribe(res => {
      this.loadEvents();
    });
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
  private resizeEvent(args: any){
    this.eventService.resizeEvent(args,this.eventCriteria);
  }
  private mouveEventAtResources(args:any){
    this.eventService.mouveEventAtResources(args,this.eventCriteria);
  }
  loadEvents(): void {
    this.eventCriteria.start = this.nav.control.visibleStart().toString();
    this.eventCriteria.end = this.nav.control.visibleEnd().toString();
    this.eventService.searchEvents(this.eventCriteria);
  }
  changeDate(date: DayPilot.Date): void {
    this.config.startDate = date;
  }
}

