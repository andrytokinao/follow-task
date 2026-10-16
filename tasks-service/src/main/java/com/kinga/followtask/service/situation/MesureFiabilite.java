package com.kinga.followtask.service.situation;

import com.kinga.followtask.dto.situation.FiabiliteDTO;
import com.kinga.followtask.service.rappel.Couverture;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Fiabilite de la situation. Pendant les heures de travail, c'est la part des
 * ouvriers dont le planning dit ce qu'ils font maintenant ; en dehors (midi,
 * soir, week-end), personne n'a a etre en activite : on mesure alors le
 * remplissage de la journee, a defaut celui du dernier jour ouvrable.
 *
 * <pre>
 * situation-direction.seuil-fiable=90
 * situation-direction.seuil-partielle=60
 * </pre>
 */
@Component
public class MesureFiabilite {

    private final int seuilFiable;
    private final int seuilPartielle;

    public MesureFiabilite(@Value("${situation-direction.seuil-fiable:90}") int seuilFiable,
                           @Value("${situation-direction.seuil-partielle:60}") int seuilPartielle) {
        this.seuilFiable = seuilFiable;
        this.seuilPartielle = seuilPartielle;
    }

    /**
     * @param etats  etat de chaque ouvrier a l'instant
     * @param veilles couverture du dernier jour ouvrable de chaque ouvrier ; vide s'il n'y en a pas
     */
    public FiabiliteDTO mesurer(List<EtatDuJour> etats, List<Couverture> veilles, boolean enHoraires) {
        int aJour = (int) etats.stream().filter(e -> e.etat().planningAJour()).count();
        Integer jour = remplissage(etats.stream().map(EtatDuJour::couverture).toList());
        Integer veille = remplissage(veilles);
        Integer part;
        if (enHoraires) {
            part = etats.isEmpty() ? null : Math.round(aJour * 100f / etats.size());
        } else {
            part = jour != null ? jour : veille;
        }
        NiveauFiabilite niveau = part == null ? null : NiveauFiabilite.de(part, seuilFiable, seuilPartielle);
        return new FiabiliteDTO(etats.size(), aJour, enHoraires, jour, veille, part, niveau);
    }

    /** Minutes couvertes / attendues de toute l'equipe, en % ; null si rien n'etait attendu. */
    static Integer remplissage(List<Couverture> couvertures) {
        long attendues = couvertures.stream().mapToLong(Couverture::minutesAttendues).sum();
        long couvertes = couvertures.stream().mapToLong(Couverture::minutesCouvertes).sum();
        return attendues == 0 ? null : (int) Math.round(couvertes * 100.0 / attendues);
    }
}
