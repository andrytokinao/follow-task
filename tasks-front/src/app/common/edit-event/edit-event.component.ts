import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {EventApp, Issue} from "../../type/issue";
import {EventsService} from "../../services/events.service";
import {IssueService} from "../../services/issue.service";

@Component({
  standalone: false,
  selector: 'app-edit-event',
  templateUrl: './edit-event.component.html',
  styleUrl: './edit-event.component.css'
})
export class EditEventComponent implements OnInit , AfterViewInit{
  @Input() event: EventApp;
  @Input() byIssue = false;
  @Output() saved = new EventEmitter<void>();

  toClose:boolean = false;

  editEventForm: FormGroup;
  submitted = false;
  protected masters:Issue[] =[];
  subtasksList: Issue[]=[];
  protected selectedMaster: Issue;
  protected selectedSubtask: Issue;


  constructor(
    public activeModal: NgbActiveModal,
              private fb: FormBuilder,
              private eventService:EventsService,
              private issueService:IssueService
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
    this.issueService.issueMasterList$.subscribe(masters=> {
      this.masters = masters;
    });
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.editEventForm.invalid) {
      return;
    }
    if(this.selectedMaster) {
      this.event.issue = {id:this.selectedMaster.id};
    }
    if (this.selectedSubtask) {
      this.event.issue = {id:this.selectedSubtask.id};
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
      };
      if (this.event.issue) {
        this.selectedSubtask = this.event.issue;
        if (this.event.issue.parent == null) {
          this.selectedMaster = this.event.issue;
          this.selectedSubtask = null;
        } else {
          this.selectedMaster = this.event.issue.parent;
        }
      }
    })

  }

  selectSubtask(im: Issue) {
     this.selectedSubtask = im;
  }

  selectMaster(im: Issue) {
    this.issueService.loadSubtask(im.id).subscribe(issues=> {
      this.subtasksList = issues;
    })
    this.selectedMaster = im;
  }

  clickMenu($event: MouseEvent) {
    if (!this.toClose) {
      $event.stopPropagation();
    } else {
      this.toClose = false;
    }
  }
  ngAfterViewInit(): void {
    this.toClose = false;


  }
}
