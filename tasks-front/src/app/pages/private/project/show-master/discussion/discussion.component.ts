import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {Subject, takeUntil} from "rxjs";
import {Issue} from "../../../../../type/issue";
import {IssueService} from "../../../../../services/issue.service";
import {MessagingService} from "../../../../../services/messaging.service";
import {IssueCanalLink, IssueMessageLink, MessageDto, TypeCanal} from "../../../../../models/messaging.model";

/** Un canal de la colonne de gauche, avec les messages qui lui reviennent. */
interface Canal {
  /** Identifiant externe : seule clé commune entre un canal et un message. */
  externalId: string;
  pseudo: string;
  type: TypeCanal | string;
  /** Liaison canal ↔ issue, absente quand le canal n'est connu que par ses
   *  messages. */
  lien?: IssueCanalLink;
  messages: IssueMessageLink[];
}

/** Messages d'une même journée, comme dans une messagerie. */
interface Journee {
  cle: string;
  libelle: string;
  messages: IssueMessageLink[];
}

/**
 * Discussion d'une issue maître : les canaux et les messages qu'on lui a
 * rattachés.
 *
 * Deux volets : les canaux à gauche, les messages du canal retenu à droite.
 *
 * La colonne de gauche ne se construit pas seulement sur les canaux liés :
 * un message peut être rattaché à l'issue sans que son canal le soit. Ces
 * canaux-là sont déduits des messages, et signalés comme tels — sinon leurs
 * messages n'auraient nulle part où s'afficher.
 */
@Component({
  standalone: false,
  selector: 'app-discussion',
  templateUrl: './discussion.component.html',
  styleUrl: './discussion.component.css'
})
export class DiscussionComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  issue: Issue | undefined;
  chargement = false;
  erreur = '';

  canaux: Canal[] = [];
  canalRetenu: Canal | undefined;
  journees: Journee[] = [];

  /** Filtre de la colonne de gauche. */
  recherche = '';

  constructor(
    private router: Router,
    protected issueService: IssueService,
    private messagingService: MessagingService
  ) {
  }

  ngOnInit(): void {
    this.issueService.issueMaster$
      .pipe(takeUntil(this.destroy$))
      .subscribe(issue => {
        this.issue = issue;
        if (issue?.id) {
          this.charger(issue.id);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -----------------------------------------------------------------------
  // Chargement
  // -----------------------------------------------------------------------

  charger(issueId?: number): void {
    const id = issueId ?? this.issue?.id;
    if (id == null) {
      return;
    }
    this.chargement = true;
    this.erreur = '';

    this.messagingService.issueDiscussion(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: issue => {
          this.chargement = false;
          this.construire(issue);
        },
        error: cause => {
          this.chargement = false;
          this.erreur = "Le chargement de la discussion a échoué.";
          console.error('[DISCUSSION]', cause);
        }
      });
  }

  private construire(issue: Issue | null): void {
    const liensCanaux: IssueCanalLink[] = (issue?.canalLinks ?? []) as IssueCanalLink[];
    const liensMessages: IssueMessageLink[] = (issue?.messageLinks ?? []) as IssueMessageLink[];

    const index = new Map<string, Canal>();

    for (const lien of liensCanaux) {
      const externalId = String(lien?.canall?.externalId ?? '');
      if (!externalId) {
        continue;
      }
      index.set(externalId, {
        externalId,
        pseudo: String(lien.canall?.pseudo || 'Canal sans nom'),
        type: String(lien.canall?.typeCanal ?? ''),
        lien,
        messages: []
      });
    }

    for (const lien of liensMessages) {
      const message = (lien as any)?.message as MessageDto | undefined;
      const canalDuMessage = message?.canall;
      const externalId = String(message?.canalExternalId || canalDuMessage?.externalId || '');
      if (!externalId) {
        continue;
      }
      let canal = index.get(externalId);
      if (!canal) {
        // Canal connu par ses seuls messages : on le crée pour ne pas perdre
        // les messages, sans prétendre qu'il est rattaché à l'issue. Son nom
        // vient du canal porté par le message ; l'identifiant externe n'est
        // qu'un dernier recours, illisible pour l'utilisateur.
        canal = {
          externalId,
          pseudo: String(canalDuMessage?.pseudo || message?.senderDisplayName || externalId),
          type: String(canalDuMessage?.typeCanal ?? ''),
          messages: []
        };
        index.set(externalId, canal);
      } else if (canalDuMessage?.pseudo && canal.pseudo === externalId) {
        // Un canal d'abord vu sans nom se nomme dès qu'un message le porte.
        canal.pseudo = String(canalDuMessage.pseudo);
        canal.type = canal.type || String(canalDuMessage.typeCanal ?? '');
      }
      canal.messages.push(lien);
    }

    for (const canal of index.values()) {
      canal.messages.sort((a, b) => this.horodatage(a) - this.horodatage(b));
    }

    // Les canaux les plus actifs d'abord : c'est là que se trouve la
    // conversation qu'on vient consulter.
    this.canaux = [...index.values()].sort((a, b) =>
      b.messages.length - a.messages.length || a.pseudo.localeCompare(b.pseudo));

    // On conserve le canal ouvert si l'actualisation le ramène.
    const precedent = this.canalRetenu?.externalId;
    const retrouve = this.canaux.find(canal => canal.externalId === precedent);
    this.selectionner(retrouve ?? this.canaux[0]);
  }

  // -----------------------------------------------------------------------
  // Sélection et regroupement
  // -----------------------------------------------------------------------

  selectionner(canal: Canal | undefined): void {
    this.canalRetenu = canal;
    this.journees = canal ? this.parJour(canal.messages) : [];
  }

  private parJour(liens: IssueMessageLink[]): Journee[] {
    const index = new Map<string, Journee>();
    for (const lien of liens) {
      const date = new Date(this.horodatage(lien));
      if (isNaN(date.getTime())) {
        continue;
      }
      const cle = date.toISOString().slice(0, 10);
      let journee = index.get(cle);
      if (!journee) {
        journee = {cle, libelle: this.libelleJour(date), messages: []};
        index.set(cle, journee);
      }
      journee.messages.push(lien);
    }
    return [...index.values()].sort((a, b) => a.cle.localeCompare(b.cle));
  }

  private libelleJour(date: Date): string {
    const jour = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const aujourdhui = new Date();
    const debutAujourdhui = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate());
    const ecart = Math.round((debutAujourdhui.getTime() - jour.getTime()) / 86_400_000);
    if (ecart === 0) {
      return "Aujourd'hui";
    }
    if (ecart === 1) {
      return 'Hier';
    }
    return jour.toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
  }

  private horodatage(lien: IssueMessageLink): number {
    const message = (lien as any)?.message as MessageDto | undefined;
    const brut = message?.createdAt ?? lien?.linkedAt;
    const date = new Date(brut as any);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  }

  // -----------------------------------------------------------------------
  // Présentation
  // -----------------------------------------------------------------------

  get canauxFiltres(): Canal[] {
    const terme = this.recherche.trim().toLowerCase();
    if (!terme) {
      return this.canaux;
    }
    return this.canaux.filter(canal =>
      canal.pseudo.toLowerCase().includes(terme) ||
      String(canal.type).toLowerCase().includes(terme));
  }

  get totalMessages(): number {
    return this.canaux.reduce((somme, canal) => somme + canal.messages.length, 0);
  }

  get vide(): boolean {
    return !this.chargement && !this.canaux.length;
  }

  message(lien: IssueMessageLink): MessageDto | undefined {
    return (lien as any)?.message;
  }

  auteur(lien: IssueMessageLink): string {
    const message = this.message(lien);
    if (message?.fromMe) {
      return 'Moi';
    }
    return message?.senderDisplayName || 'Interlocuteur';
  }

  heure(lien: IssueMessageLink): string {
    const date = new Date(this.horodatage(lien));
    return isNaN(date.getTime())
      ? ''
      : date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'});
  }

  initiales(nom: string): string {
    const mots = (nom || '').trim().split(/\s+/).filter(Boolean);
    if (!mots.length) {
      return '?';
    }
    const lettres = mots.length === 1
      ? mots[0].slice(0, 2)
      : mots[0].charAt(0) + mots[1].charAt(0);
    return lettres.toUpperCase();
  }

  /** Icône du fournisseur : le canal se reconnaît d'abord à sa provenance. */
  icone(type: string | TypeCanal): string {
    switch (String(type).toUpperCase()) {
      case 'WHATSAPP':
        return 'fab fa-whatsapp';
      case 'FACEBOOK':
        return 'fab fa-facebook-messenger';
      case 'TELEGRAM':
        return 'fab fa-telegram';
      case 'INSTAGRAM':
        return 'fab fa-instagram';
      case 'SLACK':
        return 'fab fa-slack';
      case 'EMAIL':
        return 'fas fa-envelope';
      case 'SMS':
        return 'fas fa-comment-sms';
      case 'PROJECT':
      case 'ISSUE':
        return 'fas fa-diagram-project';
      default:
        return 'fas fa-comments';
    }
  }

  couleur(type: string | TypeCanal): string {
    switch (String(type).toUpperCase()) {
      case 'WHATSAPP':
        return '#25d366';
      case 'FACEBOOK':
        return '#0084ff';
      case 'TELEGRAM':
        return '#229ed9';
      case 'INSTAGRAM':
        return '#e1306c';
      case 'SLACK':
        return '#4a154b';
      case 'EMAIL':
        return '#6b7280';
      default:
        return '#1565c0';
    }
  }

  estPieceJointe(lien: IssueMessageLink): boolean {
    return !!this.message(lien)?.hasAttachment;
  }

  /** Ouvre le canal complet dans la messagerie, hors du périmètre de l'issue. */
  ouvrirCanal(canal: Canal | undefined): void {
    if (!canal?.externalId || !this.issue?.project?.prefix) {
      return;
    }
    this.router.navigate(['/working', this.issue.project.prefix, 'messaging'], {
      queryParams: {canal: canal.externalId}
    });
  }

  trackByCanal(index: number, canal: Canal): string {
    return canal.externalId;
  }

  trackByJournee(index: number, journee: Journee): string {
    return journee.cle;
  }

  trackByLien(index: number, lien: IssueMessageLink): string {
    return String(lien?.id ?? index);
  }
}
