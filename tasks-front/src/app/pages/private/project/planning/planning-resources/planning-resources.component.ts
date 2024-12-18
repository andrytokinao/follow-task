import {Component, ViewChild, AfterViewInit} from "@angular/core";
import {DayPilot, DayPilotCalendarComponent} from "@daypilot/daypilot-lite-angular";
import {BehaviorSubject, filter, forkJoin} from "rxjs";
import {EventsService} from "../../../../../services/events.service";
import {EventSearchCriteria} from "../../../../../type/issue";

@Component({
  selector: 'calendar-component-resources',
  template: `<daypilot-calendar [config]="config" #calendar></daypilot-calendar>`,
  styles: [``]
})
export class PlanningResourcesComponent implements AfterViewInit {

  @ViewChild("calendar")
  calendar!: DayPilotCalendarComponent;
  eventCriteria:EventSearchCriteria={};
  startDate:string =  "2024-12-20";
  config: DayPilot.CalendarConfig = {
    viewType: "Resources",
    headerHeight: 100,
    startDate: this.startDate,
    onEventResize: (args) => this.resizeEvent(args),
    onEventMove:(args) => this.mouveEventAtResources(args),
    contextMenu: new DayPilot.Menu({
      items: [
        {
          text: "Edit...",
          onClick: async args => {
            const data = args.source.data;
            const modal = await DayPilot.Modal.prompt("Edit event text:", data.text);

            const calendar = this.calendar.control;
            if (modal.canceled) {
              return;
            }

            data.text = modal.result;
            calendar.events.update(data);
          }
        },
        {
          text: "Delete",
          onClick: args => {
            this.calendar.control.events.remove(args.source);
          }
        }
      ]
    }),
    onTimeRangeSelected: async args => {
      const modal = await DayPilot.Modal.prompt("Create a new event:", "Event 1");

      const calendar = this.calendar.control;
      calendar.clearSelection();
      if (modal.canceled) {
        return;
      }

      calendar.events.add({
        start: args.start,
        end: args.end,
        id: DayPilot.guid(),
        text: modal.result,
        resource: args.resource
      });

    },
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
  private events: any[];
  private resources: any[];

  constructor(private eventService: EventsService) {
  }

  ngAfterViewInit(): void {

    const from = new DayPilot.Date(this.config.startDate);
    const to = from.addDays(1);
    this.eventCriteria.start =  from.toString();
    this.eventCriteria.end =  to.toString();
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
}

