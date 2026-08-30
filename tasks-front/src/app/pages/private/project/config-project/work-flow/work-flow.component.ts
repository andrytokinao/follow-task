import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {IssueService} from "../../../../../services/issue.service";
import {ConfigService} from "../../../../../services/config.service";
import {ConfirmationDialogService} from "../../../../../services/confirmation-dialog.service";
import {CrossingState, NodePosition, Project, Status, WorkFlow} from "../../../../../type/issue";

/** Un statut place sur le diagramme. */
export interface DiagramNode {
  status: Status;
  x: number;
  y: number;
}

/** Une transition prete a etre dessinee. */
export interface DiagramEdge {
  crossing: CrossingState;
  path: string;
  labelX: number;
  labelY: number;
}

@Component({
  selector: 'app-work-flow',
  standalone: false,
  templateUrl: './work-flow.component.html',
  styleUrl: './work-flow.component.css'
})
export class WorkFlowComponent implements OnInit, OnDestroy {

  /** dimensions d'un noeud, utilisees pour tracer les fleches */
  static readonly NODE_WIDTH = 180;
  static readonly NODE_HEIGHT = 56;

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLElement>;

  project: Project | any = {};
  workFlows: WorkFlow[] = [];
  selected: WorkFlow | null = null;

  nodes: DiagramNode[] = [];
  loading: boolean = false;
  saving: boolean = false;
  errorMessage: string = '';

  // ---- vue (zoom / deplacement) ----
  zoom: number = 1;
  panX: number = 0;
  panY: number = 0;

  // ---- creation de transition ----
  connectFrom: Status | null = null;
  selectedEdge: CrossingState | null = null;

  // ---- formulaires ----
  showStatusForm: boolean = false;
  newStatusName: string = '';
  newStatusColor: string = '#185FA5';
  showWorkFlowForm: boolean = false;
  newWorkFlowName: string = '';
  renaming: boolean = false;
  workFlowName: string = '';

  private draggedNode: DiagramNode | null = null;
  private dragOrigin = {x: 0, y: 0, nodeX: 0, nodeY: 0};
  private panning: boolean = false;
  private panOrigin = {x: 0, y: 0, panX: 0, panY: 0};
  private layoutTimer: any = null;
  private subscriptions: Subscription[] = [];
  private readonly onPointerMove = (event: PointerEvent) => this.handlePointerMove(event);
  private readonly onPointerUp = () => this.handlePointerUp();

  constructor(private configService: ConfigService,
              private issueService: IssueService,
              private route: ActivatedRoute,
              private modalService: NgbModal,
              private confirmationDialog: ConfirmationDialogService) {
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.issueService.project$.subscribe(project => {
        const changed = project?.id != this.project?.id;
        this.project = project;
        if (changed && project?.id) {
          this.issueService.workFlowsByProject(project.id).subscribe();
        }
      }),
      this.issueService.workFlows$.subscribe(workFlows => {
        this.workFlows = workFlows || [];
        if (!this.selected && this.workFlows.length) {
          this.selectWorkFlow(this.workFlows[0]);
        }
      })
    );
    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    if (this.layoutTimer) {
      clearTimeout(this.layoutTimer);
    }
  }

  // -----------------------------------------------------------------
  // Chargement d'un flux
  // -----------------------------------------------------------------

  selectWorkFlow(workFlow: WorkFlow) {
    if (workFlow?.id == null) {
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.connectFrom = null;
    this.selectedEdge = null;
    this.issueService.getWorkFlow(workFlow.id).subscribe({
      next: (loaded: WorkFlow) => {
        this.applyWorkFlow(loaded);
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = this.extractMessage(error);
      }
    });
  }

  private applyWorkFlow(workFlow: WorkFlow) {
    this.selected = workFlow;
    this.workFlowName = '' + (workFlow?.name || '');
    this.buildNodes();
  }

  isSelectedWorkFlow(workFlow: WorkFlow): boolean {
    return this.selected?.id == workFlow?.id;
  }

  statusCount(workFlow: WorkFlow): number {
    return (workFlow?.statuses || []).length;
  }

  // -----------------------------------------------------------------
  // Construction du diagramme
  // -----------------------------------------------------------------

  /**
   * Place les statuts : positions enregistrees si disponibles, agencement
   * automatique en couches sinon.
   */
  private buildNodes() {
    const statuses = this.selected?.statuses || [];
    const saved = this.parseLayout();
    this.nodes = statuses.map(status => ({
      status,
      x: saved[<number>status.id]?.x ?? 0,
      y: saved[<number>status.id]?.y ?? 0
    }));
    const missing = this.nodes.filter(node => saved[<number>node.status.id] == null);
    if (missing.length) {
      this.autoLayout(false);
    }
  }

  private parseLayout(): { [statusId: number]: NodePosition } {
    if (!this.selected?.layout) {
      return {};
    }
    try {
      return JSON.parse('' + this.selected.layout) || {};
    } catch (error) {
      console.warn('layout de workflow illisible', error);
      return {};
    }
  }

  /**
   * Agencement en couches : les statuts sans transition entrante forment la
   * premiere colonne, chaque transition pousse sa cible d'une colonne.
   */
  autoLayout(persist: boolean = true) {
    const crossings = this.selected?.crossingStates || [];
    const levels: { [statusId: number]: number } = {};
    this.nodes.forEach(node => levels[<number>node.status.id] = 0);

    // propagation iterative, bornee pour tolerer les cycles
    for (let round = 0; round < this.nodes.length + 1; round++) {
      let moved = false;
      crossings.forEach(crossing => {
        const from = crossing.from?.id;
        const to = crossing.to?.id;
        if (from == null || to == null || levels[from] == null || levels[to] == null) {
          return;
        }
        if (levels[to] < levels[from] + 1) {
          levels[to] = levels[from] + 1;
          moved = true;
        }
      });
      if (!moved) {
        break;
      }
    }

    const perColumn: { [level: number]: number } = {};
    this.nodes.forEach(node => {
      const level = levels[<number>node.status.id] || 0;
      const row = perColumn[level] || 0;
      perColumn[level] = row + 1;
      node.x = 60 + level * 280;
      node.y = 40 + row * 110;
    });

    if (persist) {
      this.persistLayout();
    }
  }

  get edges(): DiagramEdge[] {
    const crossings = this.selected?.crossingStates || [];
    return crossings
      .map(crossing => {
        const from = this.nodeOf(crossing.from?.id);
        const to = this.nodeOf(crossing.to?.id);
        if (!from || !to) {
          return null;
        }
        return this.buildEdge(crossing, from, to);
      })
      .filter(edge => edge != null) as DiagramEdge[];
  }

  private nodeOf(statusId: number | undefined): DiagramNode | undefined {
    if (statusId == null) {
      return undefined;
    }
    return this.nodes.find(node => node.status.id == statusId);
  }

  /**
   * Trace une courbe de Bezier horizontale entre les bords des deux noeuds.
   */
  private buildEdge(crossing: CrossingState, from: DiagramNode, to: DiagramNode): DiagramEdge {
    const w = WorkFlowComponent.NODE_WIDTH;
    const h = WorkFlowComponent.NODE_HEIGHT;
    const forward = to.x >= from.x;
    const x1 = from.x + (forward ? w : 0);
    const y1 = from.y + h / 2;
    const x2 = to.x + (forward ? 0 : w);
    const y2 = to.y + h / 2;
    const curve = Math.max(60, Math.abs(x2 - x1) / 2);
    const c1 = x1 + (forward ? curve : -curve);
    const c2 = x2 - (forward ? curve : -curve);
    return {
      crossing,
      path: `M ${x1} ${y1} C ${c1} ${y1}, ${c2} ${y2}, ${x2} ${y2}`,
      labelX: (x1 + x2) / 2,
      labelY: (y1 + y2) / 2 - 8
    };
  }

  get canvasWidth(): number {
    const max = this.nodes.reduce((value, node) => Math.max(value, node.x), 0);
    return max + WorkFlowComponent.NODE_WIDTH + 120;
  }

  get canvasHeight(): number {
    const max = this.nodes.reduce((value, node) => Math.max(value, node.y), 0);
    return max + WorkFlowComponent.NODE_HEIGHT + 120;
  }

  // -----------------------------------------------------------------
  // Deplacement des noeuds et de la vue
  // -----------------------------------------------------------------

  startNodeDrag(event: PointerEvent, node: DiagramNode) {
    if (this.connectFrom) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    this.draggedNode = node;
    this.dragOrigin = {x: event.clientX, y: event.clientY, nodeX: node.x, nodeY: node.y};
  }

  startPan(event: PointerEvent) {
    this.selectedEdge = null;
    this.panning = true;
    this.panOrigin = {x: event.clientX, y: event.clientY, panX: this.panX, panY: this.panY};
  }

  private handlePointerMove(event: PointerEvent) {
    if (this.draggedNode) {
      // les deltas ecran sont ramenes a l'echelle du diagramme
      const dx = (event.clientX - this.dragOrigin.x) / this.zoom;
      const dy = (event.clientY - this.dragOrigin.y) / this.zoom;
      this.draggedNode.x = Math.max(0, Math.round(this.dragOrigin.nodeX + dx));
      this.draggedNode.y = Math.max(0, Math.round(this.dragOrigin.nodeY + dy));
      return;
    }
    if (this.panning) {
      this.panX = this.panOrigin.panX + (event.clientX - this.panOrigin.x);
      this.panY = this.panOrigin.panY + (event.clientY - this.panOrigin.y);
    }
  }

  private handlePointerUp() {
    if (this.draggedNode) {
      this.draggedNode = null;
      this.persistLayout();
    }
    this.panning = false;
  }

  zoomIn() {
    this.zoom = Math.min(2, Math.round((this.zoom + 0.1) * 10) / 10);
  }

  zoomOut() {
    this.zoom = Math.max(0.4, Math.round((this.zoom - 0.1) * 10) / 10);
  }

  resetView() {
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
  }

  get zoomPercent(): number {
    return Math.round(this.zoom * 100);
  }

  /** Enregistre les positions, avec un delai pour grouper les deplacements. */
  private persistLayout() {
    if (this.selected?.id == null) {
      return;
    }
    const workFlowId = <number>this.selected.id;
    const layout: { [statusId: number]: NodePosition } = {};
    this.nodes.forEach(node => layout[<number>node.status.id] = {x: node.x, y: node.y});
    const payload = JSON.stringify(layout);

    if (this.layoutTimer) {
      clearTimeout(this.layoutTimer);
    }
    this.layoutTimer = setTimeout(() => {
      this.issueService.saveWorkFlowLayout(workFlowId, payload).subscribe({
        next: () => {
          if (this.selected) {
            this.selected.layout = payload;
          }
        },
        error: (error) => this.errorMessage = this.extractMessage(error)
      });
    }, 400);
  }

  // -----------------------------------------------------------------
  // Transitions
  // -----------------------------------------------------------------

  startConnect(status: Status, event: Event) {
    event.stopPropagation();
    this.selectedEdge = null;
    this.connectFrom = this.connectFrom?.id == status.id ? null : status;
  }

  cancelConnect() {
    this.connectFrom = null;
  }

  onNodeClick(node: DiagramNode, event: Event) {
    event.stopPropagation();
    if (!this.connectFrom) {
      return;
    }
    if (this.connectFrom.id == node.status.id) {
      this.connectFrom = null;
      return;
    }
    this.createTransition(this.connectFrom, node.status);
  }

  isConnectSource(node: DiagramNode): boolean {
    return this.connectFrom?.id == node.status.id;
  }

  private createTransition(from: Status, to: Status) {
    if (this.selected?.id == null) {
      return;
    }
    this.errorMessage = '';
    this.saving = true;
    this.issueService.saveCrossingState(<number>this.selected.id, {
      name: 'Vers ' + to.displayName,
      from: <number>from.id,
      to: <number>to.id
    }).subscribe({
      next: (workFlow) => {
        this.saving = false;
        this.connectFrom = null;
        this.applyWorkFlow(workFlow);
      },
      error: (error) => {
        this.saving = false;
        this.connectFrom = null;
        this.errorMessage = this.extractMessage(error);
      }
    });
  }

  selectEdge(edge: DiagramEdge, event: Event) {
    event.stopPropagation();
    this.selectedEdge = this.selectedEdge?.id == edge.crossing.id ? null : edge.crossing;
  }

  isSelectedEdge(edge: DiagramEdge): boolean {
    return this.selectedEdge?.id == edge.crossing.id;
  }

  renameEdge(name: string) {
    if (this.selected?.id == null || !this.selectedEdge) {
      return;
    }
    this.saving = true;
    this.issueService.saveCrossingState(<number>this.selected.id, {
      id: this.selectedEdge.id,
      name,
      description: this.selectedEdge.description,
      from: <number>this.selectedEdge.from?.id,
      to: <number>this.selectedEdge.to?.id
    }).subscribe({
      next: (workFlow) => {
        this.saving = false;
        this.selectedEdge = null;
        this.applyWorkFlow(workFlow);
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = this.extractMessage(error);
      }
    });
  }

  deleteEdge(crossing: CrossingState) {
    if (this.selected?.id == null || crossing.id == null) {
      return;
    }
    this.confirmationDialog.confirm(
      'Supprimer la transition',
      `Supprimer la transition « ${crossing.name || ''} » ?`,
      'Supprimer', 'Annuler'
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.saving = true;
      this.issueService.deleteCrossingState(<number>this.selected!.id, <number>crossing.id).subscribe({
        next: (workFlow) => {
          this.saving = false;
          this.selectedEdge = null;
          this.applyWorkFlow(workFlow);
        },
        error: (error) => {
          this.saving = false;
          this.errorMessage = this.extractMessage(error);
        }
      });
    }).catch(() => {
    });
  }

  // -----------------------------------------------------------------
  // Statuts
  // -----------------------------------------------------------------

  toggleStatusForm() {
    this.showStatusForm = !this.showStatusForm;
    this.newStatusName = '';
    this.newStatusColor = '#185FA5';
  }

  addStatus() {
    if (!this.newStatusName.trim() || this.selected?.id == null) {
      return;
    }
    const status: any = {displayName: this.newStatusName.trim(), color: this.newStatusColor};
    const workFlow: any = {id: this.selected.id, project: {id: this.project?.id}};
    this.errorMessage = '';
    this.saving = true;
    this.issueService.addStatus(status, workFlow, null).subscribe({
      next: (saved: WorkFlow) => {
        this.saving = false;
        this.showStatusForm = false;
        this.newStatusName = '';
        this.applyWorkFlow(saved);
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = this.extractMessage(error);
      }
    });
  }

  removeStatus(status: Status, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (this.selected?.id == null || status.id == null) {
      return;
    }
    this.confirmationDialog.confirm(
      'Retirer le statut',
      `Retirer « ${status.displayName} » de ce flux ? Les transitions qui y mènent seront supprimées.`,
      'Retirer', 'Annuler'
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.saving = true;
      this.issueService.removeStatusFromWorkFlow(<number>this.selected!.id, <number>status.id).subscribe({
        next: (workFlow) => {
          this.saving = false;
          this.applyWorkFlow(workFlow);
        },
        error: (error) => {
          this.saving = false;
          this.errorMessage = this.extractMessage(error);
        }
      });
    }).catch(() => {
    });
  }

  // -----------------------------------------------------------------
  // Flux de travail
  // -----------------------------------------------------------------

  toggleWorkFlowForm() {
    this.showWorkFlowForm = !this.showWorkFlowForm;
    this.newWorkFlowName = '';
  }

  createWorkFlow() {
    if (!this.newWorkFlowName.trim()) {
      return;
    }
    this.saveWorkFlow({name: this.newWorkFlowName.trim()}, () => {
      this.showWorkFlowForm = false;
      this.newWorkFlowName = '';
    });
  }

  startRename() {
    this.renaming = true;
    this.workFlowName = '' + (this.selected?.name || '');
  }

  applyRename() {
    if (!this.selected || !this.workFlowName.trim()) {
      this.renaming = false;
      return;
    }
    this.saveWorkFlow({id: this.selected.id, name: this.workFlowName.trim()}, () => this.renaming = false);
  }

  private saveWorkFlow(payload: any, done: () => void) {
    this.errorMessage = '';
    this.saving = true;
    const workFlow: any = {...payload, project: {id: this.project?.id}};
    this.issueService.saveWorkFlow(workFlow).subscribe({
      next: (saved: WorkFlow) => {
        this.saving = false;
        done();
        this.reloadList(saved);
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = this.extractMessage(error);
      }
    });
  }

  deleteWorkFlow(workFlow: WorkFlow, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (workFlow?.id == null) {
      return;
    }
    this.confirmationDialog.confirm(
      'Supprimer le flux',
      `Supprimer définitivement « ${workFlow.name} » ?`,
      'Supprimer', 'Annuler'
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.errorMessage = '';
      this.issueService.deleteWorkFlow(<number>workFlow.id).subscribe({
        next: () => {
          if (this.selected?.id == workFlow.id) {
            this.selected = null;
            this.nodes = [];
          }
          this.reloadList(null);
        },
        error: (error) => this.errorMessage = this.extractMessage(error)
      });
    }).catch(() => {
    });
  }

  private reloadList(toSelect: WorkFlow | null) {
    if (!this.project?.id) {
      return;
    }
    this.issueService.workFlowsByProject(this.project.id).subscribe({
      next: () => {
        if (toSelect) {
          this.selectWorkFlow(toSelect);
        }
      },
      error: (error) => this.errorMessage = this.extractMessage(error)
    });
  }

  private extractMessage(error: any): string {
    const graphQlMessage = error?.graphQLErrors?.length ? error.graphQLErrors[0].message : null;
    return graphQlMessage || error?.message || "L'opération a échoué.";
  }

  colorOf(status: Status, fallback: string): string {
    return '' + (status?.color || fallback);
  }

  trackByNode(index: number, node: DiagramNode): number {
    return <number>node.status.id;
  }

  trackByEdge(index: number, edge: DiagramEdge): number {
    return <number>edge.crossing.id;
  }
}
