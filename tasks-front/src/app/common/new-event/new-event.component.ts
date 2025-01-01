import {AfterViewInit, Component, OnInit} from '@angular/core';
import {EventsService} from "../../services/events.service";
import {EventApp, EventTypeApp, Issue, User} from "../../type/issue";
import {DayPilot} from "@daypilot/daypilot-lite-angular";
import Date = DayPilot.Date;
import {AuthService} from "../../services/auth.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {UserService} from "../../services/user.service";
import {IssueService} from "../../services/issue.service";

@Component({
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

  constructor(private eventService: EventsService,
              private autService:AuthService,
              private activeModal: NgbActiveModal,
              private userService:UserService,
              public issueService:IssueService
  ) {}


  onSubmit(): void {
    if (this.event.title && this.event.eventType && this.user) {
      if (this.issue != null) {
        let issue = {id:this.issue.id}
        this.event.issue = issue;
      }
      this.event.user = this.user;
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

  }

  ngAfterViewInit(): void {
    this.eventService.allEventType().subscribe(res=> {
      this.eventTypes = res;
    });
    this.autService.connectedUser$.subscribe(user => {
      this.user = user;
      this.mee = user;
    });
    this.userService.users$.subscribe(users=> {
      this.users = users;
    });
    this.loadSubtask();

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
}

