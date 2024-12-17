import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {DayPilot} from "@daypilot/daypilot-lite-angular";
import {HttpClient} from "@angular/common/http";
import CalendarColumnData = DayPilot.CalendarColumnData;
import EventData = DayPilot.EventData;
import {EventApp, EventSearchCriteria, EventTypeApp, IssueType} from "../type/issue";
import * as operation from "../type/graphql.operations";
import {stripTypename} from "@apollo/client/utilities";
import {Apollo} from "apollo-angular";
import {ALL_CUSTOM_FIELD, SEARCH_EVENTS, supprimerTypename} from "../type/graphql.operations";
import _default from "chart.js/dist/plugins/plugin.legend";
import {NewIssueComponent} from "../pages/private/project/modal/new-issue/new-issue.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {EditEventComponent} from "../common/edit-event/edit-event.component";
import {NewEventComponent} from "../common/new-event/new-event.component";

@Injectable({
  providedIn:"root"
})
export class EventsService {
  private eventsSubject = new BehaviorSubject<any[]>([]);
  private eventTypes:EventTypeApp[] = [];
  events$=this.eventsSubject.asObservable();
  static colors = {
    green: "#6aa84f",
    yellow: "#f1c232",
    red: "#cc4125",
    gray: "#808080",
    blue: "#2e78d6",
  };

  events1 = [
    {
      id: 1,
      text: "Project 1",
      start: DayPilot.Date.today().firstDayOfWeek().addHours(10),
      end: DayPilot.Date.today().firstDayOfWeek().addHours(13),
      participants: 2,
      resource: "R3",
    },
    {
      id: 2,
      text: "Event 2",
      start: DayPilot.Date.today().firstDayOfWeek().addDays(1).addHours(12),
      end: DayPilot.Date.today().firstDayOfWeek().addDays(1).addHours(15),
      backColor: EventsService.colors.green,
      participants: 1,
      resource: "R3",
    },
    {
      id: 3,
      text: "Event 3",
      start: DayPilot.Date.today().firstDayOfWeek().addDays(2).addHours(13),
      end: DayPilot.Date.today().firstDayOfWeek().addDays(2).addHours(16),
      backColor: EventsService.colors.yellow,
      participants: 3,
      resource: "R3",
    },
    {
      id: 4,
      text: "Event 4",
      start: DayPilot.Date.today().firstDayOfWeek().addDays(7).addHours(11),
      end: DayPilot.Date.today().firstDayOfWeek().addDays(7).addHours(15),
      backColor: EventsService.colors.red,
      participants: 4,
      resource: "R3",
    },
  ];
  private eventApps: EventApp[] = [];

  constructor(
    private http : HttpClient,
    private apollo:Apollo,
    private modalService: NgbModal

  ){
  }
  setEvents(events:any[]){
    this.eventApps = events;
    console.debug(this.eventApps);
    this.eventsSubject.next(this.toEventDataList(events));
  }

  getEvents(from: DayPilot.Date, to: DayPilot.Date): Observable<any[]> {

    // simulating an HTTP request
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(this.events2);
        observer.complete();
      }, 200);
    });

    // return this.http.get("/api/events?from=" + from.toString() + "&to=" + to.toString());
  }

  getColors(): any[] {
      const colors = [
        {name: "Green", id: EventsService.colors.green},
        {name: "Yellow", id: EventsService.colors.yellow},
        {name: "Red", id: EventsService.colors.red},
        {name: "Gray", id: EventsService.colors.gray},
        {name: "Blue", id: EventsService.colors.blue},
      ];
      return colors;
  }
  events2: EventData[] = [
    {
      id: 1,
      start: "2025-09-01T13:00:00",
      end: "2025-09-01T15:00:00",
      text: "Event 1",
      resource: "R1",
      barColor: "#f1c232"
    },
    {
      id: 2,
      start: "2025-09-01T10:00:00",
      end: "2025-09-01T12:00:00",
      text: "Event 2",
      resource: "R1",
      barColor: "#6fa8dc"
    },
    {
      id: 3,
      start: "2025-09-01T11:00:00",
      end: "2025-09-01T14:00:00",
      text: "Event 3",
      resource: "R2",
      barColor: "#f1c232"
    },
    {
      id: 4,
      start: "2025-09-01T10:00:00",
      end: "2025-09-01T12:00:00",
      text: "Event 4",
      resource: "R3",
      barColor: "#6aa84f"
    },
    {
      id: 5,
      start: "2025-09-01T11:00:00",
      end: "2025-09-01T14:00:00",
      text: "Event 5",
      resource: "R4",
      barColor: "#6fa8dc"
    },
    {
      id: 5,
      start: "2025-09-01T13:00:00",
      end: "2025-09-01T14:30:00",
      text: "Event 6",
      resource: "R3",
      barColor: "#cc0000"
    },

  ];

  resources: CalendarColumnData[] = [
    {name: "Resource 1", id: "R1", tags: { image: "/avatars/pat-blue.jpg" } },
    {name: "Resource 2", id: "R2", tags: { image: "/avatars/pat-orange.jpg" } },
    {name: "Resource 3", id: "R3", tags: { image: "/avatars/pat-red.jpg" } },
    {name: "Resource 4", id: "R4", tags: { image: "/avatars/pat-yellow.jpg" } },
    {name: "Resource 5", id: "R5", tags: { image: "/avatars/pat-blue.jpg" } },
    {name: "Resource 6", id: "R6", tags: { image: "/avatars/pat-orange.jpg" } },
    {name: "Resource 7", id: "R7", tags: { image: "/avatars/pat-red.jpg" } },
    {name: "Resource 8", id: "R8", tags: { image: "/avatars/pat-yellow.jpg" } },
    {name: "Resource 9", id: "R9", tags: { image: "/avatars/pat-yellow.jpg" } },
    {name: "Resource 10", id: "R10", tags: { image: "/avatars/pat-yellow.jpg" } }
  ];
  getResources(): Observable<any[]> {

    // simulating an HTTP request
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(this.resources);
        observer.complete();
      }, 200);
    });

    // return this.http.get("/api/resources");
  }
  saveEvent(event:EventApp){
    return new Observable<EventApp>(observer => {
      this.apollo.mutate({
        mutation:operation.SAVE_EVENT,
        variables:{event},
        fetchPolicy:'network-only'
      }).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.saveEvent));
        observer.complete();
      }, error => {
        observer.error(error);
        console.error(error);
        observer.complete();
      })
    })
  }
  public toEventApp(eventData: EventData): EventApp {
    let eventApp: EventApp = {
      id: eventData?.id,
      title: eventData.text,
      description: eventData.html || undefined,
      eventType: undefined,
      start: typeof eventData.start === "string" ? eventData.start : eventData.start.toString(),
      end: eventData.end ? (typeof eventData.end === "string" ? eventData.end : eventData.end.toString()) : undefined,
      location: undefined,
      allDay: false,
      reminderTime: undefined,
      customColor: undefined,
      customStyle: undefined,
      reminderOffset: undefined,
      user: undefined,
      issue: undefined,
    };
    return eventApp;
  }


  // Convertit un EventApp en EventData
  public toEventData(eventApp: EventApp): EventData {
    return {
      id: eventApp.id,
      text: eventApp.title,
      start: eventApp.start,
      end: eventApp.end || undefined,
      html: eventApp.description || undefined,
      resource: eventApp.user.username || undefined,
      backColor: eventApp.customColor || undefined,
      cssClass: eventApp.customStyle || undefined,
      tags: {
        eventType: eventApp.eventType,
        allDay: eventApp.allDay,
        reminderOffset: eventApp.reminderOffset,
      },
    };
  }

  public toEventAppList(eventDataList: EventData[]): EventApp[] {
    return eventDataList.map(eventData => this.toEventApp(eventData));
  }

  // Convertit une liste de EventApp en liste de EventData
  public toEventDataList(eventAppList: EventApp[]): EventData[] {
    return eventAppList.map(eventApp => this.toEventData(eventApp));
  }
  async onEventClick(args: any) {
    const form = [
      {name: "Text", id: "text"},
      {name: "Start", id: "start", dateFormat: "MM/dd/yyyy", type: "datetime"},
      {name: "End", id: "end", dateFormat: "MM/dd/yyyy", type: "datetime"},
      {name: "Color", id: "backColor", type: "select", options: this.getColors()},
    ];

    const data = args.e.data;
    const modal = await DayPilot.Modal.form(form, data);

    if (modal.canceled) {
      return;
    }

    const dp = args.control;

    dp.events.update(modal.result);
  }
  openDialog(args:any){
    const modalRef = this.modalService.open(EditEventComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.event = args.e.data;
    modalRef.componentInstance.setData(args.e.data);
    modalRef.result.then(
      (result) => {
        if (result) {
          const dp = args.control;

          dp.events.update(result);
          console.log('Événement mis à jour :', result);
        }
      },
      (reason) => {
        console.log('Modal fermé :', reason);
      }
    );
  }
  newEvent(newEvent: EventApp){
    return new Observable<EventApp>(observer=>{
      const modalRef = this.modalService.open(NewEventComponent, {
        size: 'lg',
        backdrop: 'static',
        keyboard: false
      });
      modalRef.componentInstance.event = newEvent;
      modalRef.result.then( (result:any) => {
        observer.next(result.event);
        observer.complete();
      },(cancel:any)=>{
        observer.closed;
      })
    })


  }
  allEventType(){
    return new Observable<EventTypeApp[]>(observer=> {
      this.apollo.query({
        query:operation.ALL_EVENT_TYPE
      }).subscribe((res:any)=>{
        observer.next(supprimerTypename(res.data.allEventType));
        observer.complete();
      })
    })

  }

  searchEvents(criteria: EventSearchCriteria) {
    console.debug("eventSearchCriteria " + criteria);
    this.apollo.query({
      query: SEARCH_EVENTS,
      variables:{criteria},
      fetchPolicy: "network-only"
    }).subscribe((res: any) => {
        let eventApp: EventApp[] = supprimerTypename(res.data.searchEvents);
        this.setEvents(eventApp);
      }
    );
  }
  testCurrentEvents(){
    alert(this.eventApps);
  }
  resizeEvent(args: any,criteria:EventSearchCriteria){
    let ev =  this.eventApps.find((event) => event.id == args.e.cache.id);
    ev.start = args.newStart.toString();
    ev.end = args.newEnd.toString();
    this.saveEvent(ev).subscribe(res => {
      this.searchEvents(criteria);
    })
  }

}

