import {Component, Input, OnChanges} from '@angular/core';
import {UserService} from '../../../../../services/user.service';
import {userDisplayName} from '../../../../../type/issue-grouping.util';
import {
  ActiviteSituation,
  Apparence,
  duree,
  EtatPersonne,
  ETATS,
  ETATS_SANS_PLANNING,
  heureDe,
  lienDemande,
  SituationPersonne
} from '../situation.model';

/** Une ligne « qui fait quoi », prête à afficher. */
interface LignePersonne {
  id: string;
  nom: string;
  photo: string | null;
  departement: string | null;
  etat: Apparence;
  activite: ActiviteSituation | null;
  lienTache: string[] | null;
  /** « BAT-12 · jusqu'à 12:00 » sous la tâche en cours. */
  contexte: string;
  /** « rien depuis 09:30 » quand rien n'est planifié en ce moment. */
  rienDepuis: string;
  /** Part de la journée écoulée couverte par le planning (0-100) ; null si rien n'était attendu. */
  couverture: number | null;
  couvertureTexte: string;
}

interface GroupePersonnes {
  cle: string;
  titre: string;
  lignes: LignePersonne[];
  repliable: boolean;
}

const GROUPES: { cle: string; titre: string; etats: EtatPersonne[]; repliable: boolean }[] = [
  {cle: 'attention', titre: 'À regarder d\'abord', etats: ['NON_RENSEIGNE', 'BLOQUE', 'TROU_EN_COURS'], repliable: false},
  {cle: 'activite', titre: 'En activité', etats: ['EN_ACTIVITE', 'PAUSE_COURTE'], repliable: true},
  {cle: 'hors', titre: 'Hors horaires', etats: ['HORS_HORAIRES'], repliable: true}
];

/**
 * Bande 3 : qui fait quoi maintenant ? Une ligne par ouvrier, les problèmes en
 * premier (le serveur trie déjà par état). Au-delà d'une vingtaine de
 * personnes, les groupes sans problème se replient : l'écran reste lisible
 * d'un coup d'œil.
 */
@Component({
  standalone: false,
  selector: 'app-situation-personnes',
  templateUrl: './situation-personnes.component.html',
  styleUrl: './situation-personnes.component.css'
})
export class SituationPersonnesComponent implements OnChanges {

  static readonly REPLI_AU_DELA = 20;

  @Input() personnes: SituationPersonne[] = [];
  /** Vrai : seulement les personnes dont on ne sait pas ce qu'elles font. */
  @Input() seulementSansPlanning = false;

  groupes: GroupePersonnes[] = [];
  /** Groupes repliables que l'utilisateur a ouverts ; conservés à l'actualisation. */
  deplies = new Set<string>();
  replier = false;

  constructor(private userService: UserService) {
  }

  ngOnChanges(): void {
    const retenues = this.seulementSansPlanning
      ? this.personnes.filter(p => ETATS_SANS_PLANNING.has(p.etat))
      : this.personnes;
    this.replier = retenues.length > SituationPersonnesComponent.REPLI_AU_DELA;
    this.groupes = GROUPES
      .map(g => ({
        cle: g.cle,
        titre: g.titre,
        repliable: g.repliable,
        lignes: retenues.filter(p => g.etats.includes(p.etat)).map(p => this.ligne(p))
      }))
      .filter(g => g.lignes.length);
  }

  estReplie(groupe: GroupePersonnes): boolean {
    return this.replier && groupe.repliable && !this.deplies.has(groupe.cle);
  }

  basculer(groupe: GroupePersonnes): void {
    if (this.deplies.has(groupe.cle)) {
      this.deplies.delete(groupe.cle);
    } else {
      this.deplies.add(groupe.cle);
    }
  }

  parCle(_: number, groupe: GroupePersonnes): string {
    return groupe.cle;
  }

  parId(_: number, ligne: LignePersonne): string {
    return ligne.id;
  }

  private ligne(p: SituationPersonne): LignePersonne {
    const a = p.activite;
    return {
      id: p.personne.id,
      nom: userDisplayName(p.personne),
      // Sans photo, pas d'adresse : l'avatar montre alors les initiales.
      photo: p.personne.photo ? this.userService.getUrlPhoto(p.personne) : null,
      departement: p.departement,
      etat: ETATS[p.etat],
      activite: a,
      lienTache: a ? lienDemande(a.prefixeDepartement, a.cleTache) : null,
      contexte: a ? contexte(a) : '',
      rienDepuis: p.rienDepuis ? `rien depuis ${heureDe(p.rienDepuis)}` : '',
      couverture: p.minutesAttendues ? Math.round(p.minutesCouvertes * 100 / p.minutesAttendues) : null,
      couvertureTexte: p.minutesAttendues ? `${duree(p.minutesCouvertes)} / ${duree(p.minutesAttendues)}` : '—'
    };
  }
}

function contexte(a: ActiviteSituation): string {
  const parts: string[] = [];
  if (a.cleProjet) {
    parts.push(a.cleProjet);
  }
  if (a.fin) {
    parts.push(`jusqu'à ${heureDe(a.fin)}`);
  }
  if (a.avancement != null) {
    parts.push(`${a.avancement} %`);
  }
  return parts.join(' · ');
}
