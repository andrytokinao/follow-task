import {Component, HostListener, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ConfigService} from "../../../../../services/config.service";
import {IssueService} from "../../../../../services/issue.service";
import {UserService} from "../../../../../services/user.service";
import {AuthService} from "../../../../../services/auth.service";
import {Issue, User} from "../../../../../type/issue";

@Component({
  selector: 'app-subtask-2',
  standalone: false,
  templateUrl: './subtask-2.component.html',
  styleUrl: './subtask-2.component.scss'
})
export class Subtask2Component implements OnInit {
  constructor(private router: Router,
              private modalService: NgbModal,
              private configService: ConfigService,
              protected issueService: IssueService,
              private userService: UserService,
              private route: ActivatedRoute,
              private authService: AuthService
  ) {
  }

  private project: any;
  private profile: any;
  protected parentIssue: Issue;
  private currentIssue: null;
  private users: User[] = [];

  subtasks: Issue[];
  newSubtask: Issue;
  viewModeField: string;
  isLoading: boolean;

  tasks = [
    {
      key: 'T-001',
      summary: 'Mettre à jour la base de données , avec des style , le teste sera plus long , etc etc ',
      assignee: 'Jean Dupont',
      status: 'En cours',
      description: '<p>Cette tâche concerne la mise à jour des données produits.</p>',
      customFields: [
        { label: 'Priorité', value: 'Haute' },
        { label: 'Date limite', value: '2025-11-20' }
      ],
      attachments: ['specifications.pdf', 'notes.txt'],
      planning: [
        { title: 'Mise à jour du schéma SQL', date: '2025-11-12', time: '09:00 - 11:00' },
        { title: 'Tests de migration', date: '2025-11-14', time: '14:00 - 16:00' }
      ]

    },
    {
      key: 'T-002',
      summary: 'Corriger le bug du formulaire',
      assignee: 'Marie L.',
      status: 'À faire',
      description: '<p>Erreur dans la validation du champ email.</p>',
      customFields: [{ label: 'Priorité', value: 'Moyenne' }],
      attachments: ['capture.png'],
      planning: [
        { title: 'Mise à jour du schéma SQL', date: '2025-11-12', time: '09:00 - 11:00' },
        { title: 'Tests de migration', date: '2025-11-14', time: '14:00 - 16:00' }
      ]

    }
  ];

  selectedTask: any | null = null;
  resizing = false;

  selectTask(task: any) {
    this.selectedTask = task;
  }

  startResizing(event: MouseEvent) {
    this.resizing = true;
    document.body.style.cursor = 'col-resize';
  }

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.resizing) return;
    const list = document.querySelector('.task-list') as HTMLElement;
    const container = document.querySelector('.subtask-container') as HTMLElement;
    const containerRect = container.getBoundingClientRect();
    const newWidth = event.clientX - containerRect.left;
    if (newWidth > 200 && newWidth < containerRect.width * 0.6) {
      list.style.width = `${newWidth}px`;
    }
  }

  @HostListener('window:mouseup')
  stopResizing() {
    this.resizing = false;
    document.body.style.cursor = 'default';
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
    });
    this.issueService.project$.subscribe(project=> this.project = project)
    this.authService.getProfile().subscribe((res) => {
      this.profile = res;

    });
    this.issueService.issueMaster$.subscribe(issue => {
      this.parentIssue = issue;
      if (this.parentIssue?.id) {
        this.loadSubtask();
      }

    })

  }
  protected loadSubtask() {
    this.issueService.loadSubtask(this.parentIssue.id).subscribe(issues => {
      this.subtasks = issues;
    });
  }

}
