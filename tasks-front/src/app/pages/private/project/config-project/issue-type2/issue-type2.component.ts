import {Component, OnInit, ViewChild} from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import {IssueTypeModalComponent} from "../issue-type/issue-type-modal/issue-type-modal.component";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {IssueService} from "../../../../../services/issue.service";
import {CustomField, IssueType, Project, UsingCustomField, WorkFlow} from "../../../../../type/issue";
import namespace from "quill/core/logger";
import {BehaviorSubject} from "rxjs";
import {MatMenuTrigger} from "@angular/material/menu";



@Component({
  selector: 'app-issue-type2',
  standalone:false,
  templateUrl: './issue-type2.component.html',
  styleUrls: ['./issue-type2.component.css']
})
export class IssueType2Component implements OnInit {
  private issueTypeLevelSubject = new BehaviorSubject<'PARENT' | 'SUB_TASK'>('PARENT');
  protected currentLevel$ = this.issueTypeLevelSubject.asObservable();
  private selectedParentSubject = new BehaviorSubject<IssueType>(undefined);
  selectedParent$ = this.selectedParentSubject.asObservable();
  @ViewChild('createIssueTypeTrigger') createIssueTypeTrigger!: MatMenuTrigger;

 constructor(
   private modalService:NgbModal,
   private issueService:IssueService
 ) {
 }

  issueTypes: IssueType[] = [];
  selectedIssue: IssueType | null = null;
  draggedItem?: IssueType;
  draggedParentItem?: IssueType;
  oldParent?: IssueType;
  project:Project | undefined;



  customFieldsDemo: CustomField[] = [
    { id: 1, name: 'Priorité'},
    { id: 2, name: 'Durée estimée' },
    { id: 3, name: 'Assigné à' },
    { id: 4, name: 'Complexité'},
  ];

  ngOnInit(): void {
    this.generateDemoData();
    this.issueService.project$.subscribe(project => {this.project = project});
    this.issueService.issueType$.subscribe( issueTypes => this.issueTypes = issueTypes)
  }

  /** Génère la structure DEMO */
  generateDemoData() {
    const project: Project = { id: 1, name: 'Demo Project' };
    const workflow: WorkFlow = { id: 1, name: 'Default Workflow' };

    const parentNames = [
      'Type Parent 1',
      'Type Parent 2',
      'Type Parent 3',
      'Type Parent 4',
      'Type Parent 5'
    ];

    const subTasks = [
      ['Type sous-tâche A', 'Type sous-tâche B', 'Type sous-tâche C'],
      ['Type sous-tâche A', 'Type sous-tâche C'],
      ['Type sous-tâche D', 'Type sous-tâche E'],
      ['Type sous-tâche A', 'Type sous-tâche F'],
      ['Type sous-tâche A', 'Type sous-tâche B']
    ];

    const icons = [
      'fas fa-bug',
      'fas fa-tasks',
      'fas fa-code',
      'fas fa-wrench',
      'fas fa-project-diagram'
    ];

    this.issueTypes = parentNames.map((name, index) => {

      const parent: IssueType = {
        id: Date.now() + index,
        name,
        prefix: 'P' + (index + 1),
        level: 'PARENT',
        project,
        color: '#2196f3',
        style: '',
        curentWorkFlow: workflow,
        parent: null,
        children: []
      };

      parent.children = subTasks[index].map((st, i2) => ({
        id: Date.now() + index * 100 + i2,
        name: st,
        prefix: 'S' + (i2 + 1),
        level: 'SUB_TASK',
        project,
        color: '#4caf50',
        style: '',
        curentWorkFlow: workflow,
        parent,
        children: []
      }));

      return parent;
    });
  }

  /** Sélection pour afficher détails */
  select(issue: IssueType) {
    this.selectedIssue = issue;
  }

  /** Drag & Drop */
  drop(event:any, parent?: IssueType) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  /** Ajouter parent ou sous-tâche */
  addIssueTypeParent() {
    this.issueTypeLevelSubject.next('PARENT');

  }

  /** Changer icône */
  updateIcon(icon: string) {

  }

  dragOver(event: DragEvent) {
    event.preventDefault();
  }

  dropOnParent(newParent: IssueType) {
    if (!(this.draggedItem || this.draggedParentItem)) return;
    if (this.oldParent) {
      this.oldParent.children = this.oldParent.children.filter(c => c.id !== this.draggedItem!.id);
    }

    if (this.draggedItem) {
      newParent.children.push(this.draggedItem);

    } else {
      this.draggedParentItem.level ='SUB_TASK';
      newParent.children.push(this.draggedParentItem);

    }

    this.draggedItem.level = 'SUB_TASK';
    this.draggedItem = undefined;
    this.oldParent = undefined;
  }



  dragChildStart(child: IssueType, parent: IssueType) {
    this.draggedItem = child;
    this.oldParent = parent;
  }

  dragParentStart(parent: IssueType) {
    this.draggedParentItem = parent;
  }
  showConfigType(issueType:any) {
    const dialogRef = this.modalService.open(IssueTypeModalComponent,{windowClass: "xlModal"} );
   dialogRef.componentInstance.issueType = issueType;
   dialogRef.componentInstance.project = this.project;
    dialogRef.result.then((res) => {
      this.selectedIssue = res
    })
  }

  protected readonly namespace = namespace;

  addIssueTypeSubTask(parent: IssueType) {
    this.issueTypeLevelSubject.next('SUB_TASK');
    this.selectedParentSubject.next(parent);
  }

  reloaList(savedIssueType:IssueType) {
    this.createIssueTypeTrigger.closeMenu();
    this.issueService.allIssueType(this.project.id);
    this.selectedIssue = savedIssueType;

  }
}
