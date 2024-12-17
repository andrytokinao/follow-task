import {Component, Input} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-edit-event',
  templateUrl: './edit-event.component.html',
  styleUrl: './edit-event.component.css'
})
export class EditEventComponent {
  @Input() event: any;

  editEventForm: FormGroup;
  submitted = false;

  constructor(public activeModal: NgbActiveModal, private fb: FormBuilder) {
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
        title: this.event.text || 'vide ve ',
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

    this.activeModal.close(this.editEventForm.value);
  }
  setData(data){
    this.event = data;
    if (this.event) {
      this.editEventForm.patchValue({
        title: this.event.text ||'<b>vide ve </b>',
        start: this.event.start || '',
        end: this.event.end || '',
        description: this.event.description || '',
      });
    }
  }
}
