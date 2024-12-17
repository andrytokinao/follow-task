import {AfterViewInit, Component, OnInit} from '@angular/core';
import {EventsService} from "../../services/events.service";
import {EventApp, EventTypeApp, User} from "../../type/issue";
import {DayPilot} from "@daypilot/daypilot-lite-angular";
import Date = DayPilot.Date;
import {AuthService} from "../../services/auth.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-new-event',
  templateUrl: './new-event.component.html',
  styleUrl: './new-event.component.css'
})
export class NewEventComponent implements OnInit, AfterViewInit{
  title: string = '';
  eventType: EventTypeApp ;
  eventTypes: EventTypeApp[] = [];
  private user: User;
  event:EventApp | any ={};

  constructor(private eventService: EventsService,
              private autService:AuthService,
              private activeModal: NgbActiveModal,
  ) {}

  // Fonction pour gérer la soumission du formulaire
  onSubmit(): void {
    if (this.event.title && this.event.eventType) {


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
    })
  }
}
