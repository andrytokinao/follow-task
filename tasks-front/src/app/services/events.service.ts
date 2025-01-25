import {Injectable} from "@angular/core";
import {BehaviorSubject, Observable} from "rxjs";
import {DayPilot} from "@daypilot/daypilot-lite-angular";
import {HttpClient} from "@angular/common/http";
import CalendarColumnData = DayPilot.CalendarColumnData;
import EventData = DayPilot.EventData;
import {EventApp, EventSearchCriteria, EventTypeApp, Issue, IssueType, User} from "../type/issue";
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
import {query} from "@angular/animations";
import {IssueService} from "./issue.service";
import {ViewEventComponent} from "../pages/private/project/modal/view-event/view-event.component";
import {error} from "@angular/compiler-cli/src/transformers/util";

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
  selectedMaster : number;
  static colors = {
    green: "#6aa84f",
    yellow: "#f1c232",
    red: "#cc4125",
    gray: "#808080",
    blue: "#2e78d6",
  };
  issues:Issue[] =[]
  private eventApps: EventApp[] = [];

  constructor(
    private http : HttpClient,
    private apollo:Apollo,
    private modalService: NgbModal,
    private userService:UserService,
    private issueService:IssueService

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
      text: (eventApp.issue? eventApp.issue.issueKey+':' : '') + eventApp.title,
      start: eventApp.start,
      end: eventApp.end || undefined,
      resource: eventApp.user.username || undefined,
      backColor: eventApp.customColor || eventApp.eventType.defaultColor || undefined,
      cssClass: eventApp.customStyle || undefined,
      tags: {
        eventType: eventApp.eventType,
        allDay: eventApp.allDay,
        reminderOffset: eventApp.reminderOffset,
      },
      html:  `<div>
        <p style="font-size: 12px; "><b><i> ${(eventApp.issue ? eventApp.issue.issueKey + ': ' : '')} </i></b>${(eventApp.title)}</p>
        <p style="font-size: 12px; color: #555;">${eventApp.description || ''}</p>
      </div>
    `,

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
  editDialogAndSet(data:any, criteria:EventSearchCriteria){
    this.editDialog(data).subscribe(res => {
      this.searchEventsAndSet(criteria);
    })
  }
  editDialog(data:any){
    return new Observable<any>(observer => {
      const modalRef = this.modalService.open(EditEventComponent, {
        size: 'lg',
        backdrop: 'static',
        keyboard: false,
        centered:true,
      });
      modalRef.componentInstance.loadEvent(data.id);
      modalRef.result.then(
        (result) => {
          if (result) {
            observer.next(result);
            observer.complete();
          }
        },
        (reason) => {
          console.log('Modal fermé :', reason);
          observer.closed
        }
      );
    })

  }
  newEvent(newEvent: EventApp){
    if (this.selectedMaster) {
      this.issueService
    }
    return new Observable<EventApp>(observer=>{
      const modalRef = this.modalService.open(NewEventComponent, {
        size: 'lg',
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
  newEventForResources(newEvent:EventApp, username:String) {
    return new Observable<EventApp>(observer=>{
      this.userService.getUser(username).subscribe(user => {
          newEvent.user = user;
          this.newEvent(newEvent).subscribe( eventApp => {
            observer.next(eventApp);
            observer.complete();
            },
            err => {
               observer.error(err);
               observer.complete();
            }
          )
      });
    });
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
  searchEventsAndSet(criteria: EventSearchCriteria) {
    this.searchEvents(criteria).subscribe(events => {
      this.setEvents(events);
    });
  }
  searchEvents(criteria: EventSearchCriteria) {
    return new Observable<EventApp[]>(observer => {
      if (criteria.userIds != null && criteria.userIds.length == 0) {
        criteria.userIds = undefined;
      }
      if (criteria.issueIds != null && criteria.issueIds.length == 0) {
        criteria.issueIds = undefined;
      }
      if (criteria.parrentIds != null && criteria.parrentIds.length ==0 ) {
        criteria.parrentIds = undefined;
      }
      this.apollo.query({
        query: SEARCH_EVENTS,
        variables:{criteria},
        fetchPolicy: "network-only"
      }).subscribe((res: any) => {
        let eventApp: EventApp[] = supprimerTypename(res.data.searchEvents);
        observer.next(eventApp);
        observer.complete();
        },error => {
         console.error(error);
         observer.error(error);
         observer.complete();
        }
      );
    })

  }
  resizeEventAndLoad(args: any, criteria:EventSearchCriteria){
    this.resizeEvent(args).subscribe(res => {
      this.searchEventsAndSet(criteria);
    })
  }

  resizeEvent(args: any){
    return new Observable<EventApp>(observer => {
      this.getByEventById(args.e.cache.id).subscribe(ev=>{
        ev.start = args.newStart.toString();
        ev.end = args.newEnd.toString();
        this.saveEvent(ev).subscribe(res => {
          observer.next(res);
          observer.complete();
        } , error =>{
          observer.error(error);
          observer.complete();
        })
      })

    })

  }

  loadUserResource(){
    this.userService.users$.subscribe(users =>{
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

  mouveEventAtResources(args: any, criteria: EventSearchCriteria) {
    this.getByEventById(args.cache.id).subscribe(ev=>{
      ev.start = args.newStart.toString();
      ev.end = args.newEnd.toString();
      if (args.newResource) {
        ev.user = this.getUserByResource(args.newResource)
      }
      this.saveEvent(ev).subscribe(res => {
        this.searchEventsAndSet(criteria);
      } , error =>{
        console.error(error);
      })
    });
  }
  updateBackColor(eventData,colors,criteria:EventSearchCriteria){
    console.debug(eventData);
    this.getByEventById(eventData.cache.id).subscribe(ev=>{
      ev.customColor = colors;
      this.saveEvent(ev).subscribe(res => {
        this.searchEventsAndSet(criteria);
      } , error =>{
        console.error(error);
      })
    });
  }

  deleteEvent(data, eventCriteria: EventSearchCriteria) {
      this.apollo.mutate({
        mutation:operation.DELETE_EVENT_TYPE,
        variables:{eventId:data.id}
      }).subscribe((res:any)=>{
        this.searchEventsAndSet(eventCriteria);
      })
    }

  getByEventById(id) {
    return new Observable<EventApp>(observer => {
      this.apollo.query({
        query:operation.EVENT_BY_ID,
        variables:{eventId:id}
        }
      ).subscribe((res:any)=> {
        observer.next(supprimerTypename(res.data.getByEventId));
        observer.complete();
      })
    })
  }
  viewEvent(eventId:number){
    return new Observable<String>(observer=> {
      const modalRef = this.modalService.open(ViewEventComponent, {
        size: 'lg',
        keyboard: true,
        centered:true,
      });
      modalRef.componentInstance.loadEvent(eventId);
      modalRef.result.then((result:any) => {
        observer.next(result.next);
        observer.complete();
      }, close => {
          observer.next("close");
          observer.complete();
        }
        )
    });
  }
}

