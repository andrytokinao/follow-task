import {Component, Input} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {EventApp} from "../../type/issue";
import {EventsService} from "../../services/events.service";

@Component({
  selector: 'app-edit-event',
  templateUrl: './edit-event.component.html',
  styleUrl: './edit-event.component.css'
})
export class EditEventComponent {
  @Input() event: EventApp;

  editEventForm: FormGroup;
  submitted = false;

  constructor(
    public activeModal: NgbActiveModal,
              private fb: FormBuilder,
              private eventService:EventsService
              ) {
    this.editEventForm = this.fb.group({
      title: ['', Validators.required],
      start: ['', Validators.required],
      end: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    if (this.event) {
      this.editEventForm.patchValue({
        title: this.event.title || '',
        start: this.event.start || '',
        end: this.event.end || '',
        description: this.event.description || '',
      });
    }
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.editEventForm.invalid) {
      return;
    }
    this.eventService.saveEvent(this.event).subscribe(event => {
      this.activeModal.close(this.event);

    });
  }
  loadEvent(id){
    this.eventService.getByEventById(id).subscribe(event => {
      this.event = event;
      if (this.event) {
        this.editEventForm.patchValue({
          title: this.event.title ||'',
          start: this.event.start || '',
          end: this.event.end || '',
          description: this.event.description || '',
        });
      }
    })

  }
}
