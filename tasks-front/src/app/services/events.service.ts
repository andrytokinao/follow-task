import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {DayPilot} from "@daypilot/daypilot-lite-angular";
import {HttpClient} from "@angular/common/http";
import CalendarColumnData = DayPilot.CalendarColumnData;
import EventData = DayPilot.EventData;
import {EventApp, EventSearchCriteria, EventTypeApp, IssueType, User} from "../type/issue";
import * as operation from "../type/graphql.operations";
import {stripTypename} from "@apollo/client/utilities";
import {Apollo} from "apollo-angular";
import {ALL_CUSTOM_FIELD, SEARCH_EVENTS, supprimerTypename} from "../type/graphql.operations";
import _default from "chart.js/dist/plugins/plugin.legend";
import {NewIssueComponent} from "../pages/private/project/modal/new-issue/new-issue.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {EditEventComponent} from "../common/edit-event/edit-event.component";
import {NewEventComponent} from "../common/new-event/new-event.component";
import {UserService} from "./user.service";

@Injectable({
  providedIn:"root"
})
export class EventsService {
  private eventsSubject = new BehaviorSubject<any[]>([]);
  private resourceSubject = new BehaviorSubject<any[]>([]);
  private users:User[] = [];
  private eventTypes:EventTypeApp[] = [];
  events$=this.eventsSubject.asObservable();
  resources$ = this.resourceSubject.asObservable();
  static colors = {
    green: "#6aa84f",
    yellow: "#f1c232",
    red: "#cc4125",
    gray: "#808080",
    blue: "#2e78d6",
  };

  private eventApps: EventApp[] = [];

  constructor(
    private http : HttpClient,
    private apollo:Apollo,
    private modalService: NgbModal,
    private userService:UserService

  ){
  }
  setEvents(events:any[]){
    this.eventApps = events;
    this.eventsSubject.next(this.toEventDataList(events));
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
      backColor: eventApp.customColor || eventApp.eventType.defaultColor || undefined,
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

  resizeEvent(args: any,criteria:EventSearchCriteria){
    let ev =  this.eventApps.find((event) => event.id == args.e.cache.id);
    ev.start = args.newStart.toString();
    ev.end = args.newEnd.toString();
    this.saveEvent(ev).subscribe(res => {
      this.searchEvents(criteria);
    })
  }
  loadUserResource(){
    this.userService.getUsers("TODO").subscribe(users =>{
      let resources = users.map(user => this.userToResource(user));
      this.users = users;
      this.resourceSubject.next(resources);
    })
  }
  userToResource(user:User):CalendarColumnData{
    return {
      id: user.username,
      name:user.firstName,
      tags: { image: this.userService.getUrlPhoto(user)}
    }
  }
  getUserByResource(resource:string):User{
    return this.users.find((user)=> resource === user.username)
  }

  mouveEventAtResources(args: any, eventCriteria: EventSearchCriteria) {
    let ev =  this.eventApps.find((event) => event.id == args.e.cache.id);
    ev.start = args.newStart.toString();
    ev.end = args.newEnd.toString();
   if (args.newResource) {
     ev.user = this.getUserByResource(args.newResource)
   }
    this.saveEvent(ev).subscribe(res => {
      this.searchEvents(eventCriteria);
    })
  }
  updateBackColor(eventData,colors,criteria:EventSearchCriteria){
    console.debug(eventData);
    let ev =  this.eventApps.find((event) => event.id == eventData.cache.id);
    ev.customColor = colors;
    this.saveEvent(ev).subscribe(rap => {
      this.searchEvents(criteria);
    })
  }
}

