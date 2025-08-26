import {AfterViewInit, Component, OnInit} from '@angular/core';
import {EventsService} from "../../services/events.service";
import {EventApp, EventSearchCriteria, EventTypeApp, Issue, Project, User} from "../../type/issue";
import {DayPilot} from "@daypilot/daypilot-lite-angular";
import Date = DayPilot.Date;
import {AuthService} from "../../services/auth.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {UserService} from "../../services/user.service";
import {IssueService} from "../../services/issue.service";
import Locale = DayPilot.Locale;

@Component({
  standalone: false,
  selector: 'app-new-event',
  templateUrl: './new-event.component.html',
  styleUrl: './new-event.component.css'
})
export class NewEventComponent implements OnInit, AfterViewInit{
  title: string = '';
  eventType: EventTypeApp ;
  eventTypes: EventTypeApp[] = [];
  user: User;
  mee:User;
  event:EventApp | any ={};
  issue:Issue;
  users:User[] = [];
  // Fonction pour gérer la soumission du formulaire
  issues: Issue[]= [];
  private project: Project;
  protected masters: Issue[]=[];
  selectedMaster: Issue ;
  selectedSubtask: Issue ;
  protected subtasksList: Issue[] = [];


  constructor(private eventService: EventsService,
              private autService:AuthService,
              private activeModal: NgbActiveModal,
              private userService:UserService,
              public issueService:IssueService
  ) {}


  onSubmit(): void {
    if (this.event.title && this.event.eventType && this.user) {
      if (this.selectedMaster != null) {
        let issue = {id:this.selectedMaster.id}
        this.event.issue = issue;
      }
      if (this.selectedSubtask != null) {
        let issue = {id:this.selectedSubtask.id}
        this.event.issue = issue;
      }
      this.event.user = this.user;
      if (this.project) {
        this.event.project = {id:this.project.id};
      }

      this.eventService.saveEvent(this.event).subscribe(res => {
          this.title = '';
          this.eventType =undefined;
        this.activeModal.close({ event:res });
        }
      );
    } else {
      alert('Veuillez remplir tous les champs');
    }
  }

  ngOnInit(): void {
    this.issueService.issueMasterList$.subscribe(masters=> {
      this.masters = masters;
    });
  }

  ngAfterViewInit(): void {
    this.eventService.allEventType().subscribe(res=> {
      this.eventTypes = res;
      if(this.eventTypes && this.eventTypes.length>0)
         this.event.eventType = this.eventTypes[0];
    });
    this.autService.connectedUser$.subscribe(user => {
      this.mee = user;
      if (this.event.user ){
        this.user = this.event.user;
      } else {
        this.user = this.mee;
      }
    });
    this.userService.users$.subscribe(users=> {
      this.users = users;
    });
    this.loadSubtask();
    this.issueService.project$.subscribe( project => {
      this.project = project;
    })

  }
  loadSubtask(){
    if (this.event.issue) {
      this.issue = this.event.issue;
    }
    if (this.issue && this.issue.id) {
      this.issues = [this.issue];
      this.issueService.loadSubtask(this.issue.id).subscribe(issues => {
        if (issues.length != 0) {
          this.issues.push(...issues);
        }
      })
    } else {
      console.debug("issue is null");
    }
  }

  selectMaster(im: Issue) {
    this.selectedMaster = im;
    this.issueService.loadSubtask(this.selectedMaster.id).subscribe( issues => {
      this.subtasksList = issues;
    })
  }

  selectSubtask(im: Issue) {
    this.selectedSubtask = im;
  }
  getAvailableTime(){
    const start:Date = Date.now().addDays(-1);
    const end = Date.now().addDays(1);
    const availableStart = Date.now();
    const availableEnd = Date.now().addHours(1);

    const eventCriteria:EventSearchCriteria = {
      userIds:[this.user.id],
      end:end.toStringSortable(),
      start:start.toStringSortable()
    }
    this.eventService.searchEvents(eventCriteria).subscribe( existing => {
      if (existing && existing.length > 0) {

        this.getAvailableIntervale(availableStart,existing);
      } else {
      }
     // : TODO : Recuperation des creneau disponible
      this.event.start = availableStart.toStringSortable();
      this.event.end = availableEnd.toStringSortable();
    });



  }

  getAvailableIntervale(start:Date, existing:EventApp[]):any {
    console.debug('getAvailableIntervale',start.toStringSortable());
    let byEnd = existing.filter( e=>  {
       return ( Date.parse(e.start , '', undefined) < start)
    });
    if (byEnd.length == 0 ){
      return {
        start:start,
        end:start.addHours(1)
      }
    }
    let byStart = byEnd.filter( e => ( Date.parse(e.start , undefined, undefined)> start.addHours(1))) ;
    if (byStart.length = 0) {
      return {
        start:start,
        end:start.addHours(1)
      }
    }
    return this.getAvailableIntervale(start.addMonths(30),byStart);

  }
}

