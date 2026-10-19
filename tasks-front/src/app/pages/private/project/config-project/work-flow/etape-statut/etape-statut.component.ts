import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Status} from "../../../../../../type/issue";
import {descriptionEtape, DescriptionEtape, ETAPES_AVANCEMENT, EtapeAvancement} from "../../../../../../type/etape-avancement";
import {AvancementService} from "../../../../../../services/avancement.service";

/**
 * Étape d'avancement du statut sélectionné dans l'éditeur de flux (DT-007) :
 * c'est elle qui permet au planning de faire avancer les tâches.
 */
@Component({
  selector: 'app-etape-statut',
  standalone: false,
  templateUrl: './etape-statut.component.html',
  styleUrl: './etape-statut.component.css'
})
export class EtapeStatutComponent {

  @Input() status!: Status;
  @Input() etape: EtapeAvancement | null = null;
  /** Nouvelle étape enregistrée ; null : le statut n'en a plus. */
  @Output() etapeChange = new EventEmitter<EtapeAvancement | null>();
  @Output() fermer = new EventEmitter<void>();

  readonly etapes: DescriptionEtape[] = ETAPES_AVANCEMENT;
  enregistrement: boolean = false;
  erreur: string = '';

  constructor(private avancementService: AvancementService) {
  }

  get description(): DescriptionEtape | undefined {
    return descriptionEtape(this.etape);
  }

  choisir(valeur: string) {
    const etape = <EtapeAvancement | null>(valeur || null);
    if (etape === this.etape || this.status?.id == null) {
      return;
    }
    this.erreur = '';
    this.enregistrement = true;
    this.avancementService.definirEtape(this.status.id, etape).subscribe({
      next: (enregistree) => {
        this.enregistrement = false;
        this.etape = enregistree;
        this.etapeChange.emit(enregistree);
      },
      error: (error) => {
        this.enregistrement = false;
        this.erreur = error?.graphQLErrors?.[0]?.message || error?.message || "L'étape n'a pas été enregistrée.";
      }
    });
  }
}
