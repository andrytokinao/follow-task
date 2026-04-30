import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import {EventApp, Issue, EventTypeApp, User, Project, PercentageProposal} from '../../type/issue';
import { EventsService } from '../../services/events.service';
import { IssueService } from '../../services/issue.service';
import {AuthService} from "../../services/auth.service";

export function endAfterStartValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get('start')?.value;
    const end   = group.get('end')?.value;
    if (start && end && new Date(end) <= new Date(start)) {
      return { endBeforeStart: true };
    }
    return null;
  };
}

@Component({
  standalone: false,
  selector: 'app-edit-event',
  templateUrl: './edit-event.component.html',
  styleUrl: './edit-event.component.css'
})
export class EditEventComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() event!: EventApp ;
  @Input() byIssue = false;
  @Output() saved = new EventEmitter<EventApp>();
  @Output() onClose = new EventEmitter<boolean>();
  @Input() isNext:boolean = false;
  percentageProposal: PercentageProposal;



  loadNextEvent(issue:Issue): void {
    this.loadingEvent = true;
    this.eventService.loadNextEvent()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingEvent = false)
      )
      .subscribe({
        next: (event) => {
          this.event = event;
          this.event.issue = {id:issue.id,summary:issue.summary,issueType:issue.issueType}
          this.setDescription(event);
          this._patchForm(event);
          this._resolveIssueSelection(event);
          if (event.eventType && this.eventTypes.length) {
            this.selectedEventType = this.eventTypes.find(t => t.id === event.eventType!.id);
            if (!this.selectedEventType)
              this.selectedEventType = this.eventTypes[0];
          }
        },
        error: (err) => { console.error(err); }
      });
    this.loadPropositionPercentage(issue.id.valueOf());
  }
  project:Project;
  editEventForm!: FormGroup;
  submitted    = false;
  loading      = false;
  loadingEvent = false;
  user:User;
  get description(): string {
    return this.event?.description || '';
  }

  set description(value: string) {
    if (this.event) {
      this.event.description = value;
    }
  }
  masters:      Issue[] = [];
  subtasksList: Issue[] = [];
  @Input() selectedMaster?:  Issue;
  @Input() selectedSubtask?: Issue;

  eventTypes:         EventTypeApp[] = [];
  selectedEventType?: EventTypeApp;
  private destroy$ = new Subject<void>();
  private _toClose = false;

  get f() { return this.editEventForm.controls; }

  get endBeforeStart(): boolean {
    return this.editEventForm.hasError('endBeforeStart');
  }

  get descriptionLength(): number {
    return (this.event?.description || '').length;
  }

  constructor(
    public  activeModal:  NgbActiveModal,
    private fb:           FormBuilder,
    private eventService: EventsService,
    private issueService: IssueService,
    private authService:AuthService
  ) {}

  ngOnInit(): void {
    this._buildForm();
    this._patchForm(this.event);
    this._watchMasters();
    this._loadEventTypes();
    this._loadConnectedUser();
    this.issueService.project$.pipe().subscribe(project => {
      this.project = project;
    });
    this.eventService.selectedEventData$.pipe().subscribe(data =>{
      if (data && data.id) {
        this.loadEvent(data.id);
      }
    });
   this.eventService.nextEvent$
  }

  ngAfterViewInit(): void {
    this._toClose = false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private _buildForm(): void {
    this.editEventForm = this.fb.group(
      {
        title:       ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
        start:       ['', Validators.required],
        end:         ['', Validators.required],
        description: ['', Validators.maxLength(500)],
      },
      { validators: endAfterStartValidator() }
    );
  }

  private _patchForm(event: EventApp | null | undefined): void {
    if (!event) return;
    this.editEventForm.patchValue({
      title:       event.title       || '',
      start:       this._toDatetimeLocal(event.start),
      end:         this._toDatetimeLocal(event.end),
      description: event.description || '',
    });
  }

  private _watchMasters(): void {
    this.issueService.issueMasterList$
      .pipe(takeUntil(this.destroy$))
      .subscribe(masters => {
        this.masters = masters;
      });
  }

  private _loadEventTypes(): void {
    this.eventService.eventTypes$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (types) => {
          this.eventTypes = types;
          if (this.event?.eventType) {
            this.selectedEventType = types.find(t => t.id === this.event.eventType!.id);
          }
        },
        error: (err) => { console.error(err); }
      });
  }

  selectEventType(type: EventTypeApp): void {
    this.selectedEventType = type;
  }

  loadEvent(id: number | string): void {
    this.loadingEvent = true;
    this.eventService.getByEventById(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loadingEvent = false)
      )
      .subscribe({
        next: (event) => {
          this.event = event;
          this.setDescription(event);
          this._patchForm(event);
          this._resolveIssueSelection(event);
          if (event.eventType && this.eventTypes.length) {
            this.selectedEventType = this.eventTypes.find(t => t.id === event.eventType!.id);
            if (!this.selectedEventType)
              this.selectedEventType = this.eventTypes[0];
          }
        },
        error: (err) => { console.error(err); }
      });
  }

  private _resolveIssueSelection(event: EventApp): void {
    if (!event.issue) {
      this.selectedMaster  = undefined;
      this.selectedSubtask = undefined;
      return;
    }
    if (event.issue.parent == null) {
      this.selectedMaster  = event.issue;
      this.selectedSubtask = undefined;
    } else {
      this.selectedMaster  = event.issue.parent;
      this.selectedSubtask = event.issue;
      this._loadSubtasks(event.issue.parent.id);
    }
  }

  selectMaster(issue: Issue): void {
    this.selectedMaster  = issue;
    this.selectedSubtask = undefined;
    this._loadSubtasks(issue.id);
  }

  selectSubtask(issue: Issue): void {
    this.selectedSubtask = issue;
  }

  private _loadSubtasks(masterId: number): void {
    this.issueService.loadSubtask(masterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  (issues) => { this.subtasksList = issues; },
        error: (err)    => { console.error(err); }
      });
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.editEventForm.invalid || !this.selectedEventType) {
      this.editEventForm.markAllAsTouched();
      return;
    }

    const formValue = this.editEventForm.value;
    this.event = {
      ...this.event,
      title:       formValue.title.trim(),
      start:       formValue.start,
      end:         formValue.end,
      allDay:false,
      user:this.user,
      description: formValue.description,
      eventType:   { id: this.selectedEventType.id , name: this.selectedEventType.name } ,
      issue:this.selectedSubtask,
      project: {id:this.project.id}
    };

    if (this.selectedSubtask) {
      this.event.issue = { id: this.selectedSubtask.id } as Issue;
    } else if (this.selectedMaster) {
      this.event.issue = { id: this.selectedMaster.id } as Issue;
    }

    this.loading = true;
    this.eventService.saveEvent(this.event)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (savedEvent) => {
          this.saved.emit(savedEvent ?? this.event);
          this.activeModal.close(savedEvent ?? this.event);
        },
        error: (err) => { console.error(err); }
      });
  }

  dismiss(reason: 'close' | 'cancel' = 'cancel'): void {
    this.onClose.emit(true);
    this.activeModal.dismiss(reason);
  }

  clickMenu(event: MouseEvent): void {
    if (!this._toClose) {
      event.stopPropagation();
    } else {
      this._toClose = false;
    }
  }

  private _toDatetimeLocal(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private _loadConnectedUser() {
    this.authService.connectedUser$.subscribe(user => {
      this.user = user;
    })
  }

  private setDescription(event: EventApp) {
    this.description = event?.description || '';
  }
  loadPropositionPercentage(issueId:number) {
    this.percentageProposal = undefined;
    this.eventService.proposeNextPercentage(issueId).subscribe(proposal => {
      this.percentageProposal = proposal;
    })
  }

}
