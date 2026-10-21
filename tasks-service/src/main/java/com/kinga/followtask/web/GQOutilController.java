package com.kinga.followtask.web;

import com.kinga.followtask.dto.outil.ContenuDossierOutil;
import com.kinga.followtask.dto.outil.DossierOutilSaisie;
import com.kinga.followtask.dto.outil.DossierOutilVue;
import com.kinga.followtask.dto.outil.OutilSaisie;
import com.kinga.followtask.dto.outil.OutilVue;
import com.kinga.followtask.entity.enumapp.TypeOutil;
import com.kinga.followtask.service.outil.AccesOutilService;
import com.kinga.followtask.service.outil.ContexteOutil;
import com.kinga.followtask.service.outil.DossierOutilService;
import com.kinga.followtask.service.outil.FichierOutilService;
import com.kinga.followtask.service.outil.NavigationOutilService;
import com.kinga.followtask.service.outil.OutilService;
import com.kinga.followtask.service.outil.PolitiqueFichiersOutil;
import com.kinga.followtask.service.outil.VuesOutil;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.Arrays;
import java.util.List;

/** Menu Outils (schema {@code outils.graphqls}, DT-019). */
@Controller
@RequiredArgsConstructor
public class GQOutilController {

    /** Fichiers acceptes pour un type, tels que l'ecran les lit. */
    public record RegleFichiersOutil(TypeOutil typeOutil, List<String> extensions, long tailleMax) {
    }

    private final AccesOutilService acces;
    private final NavigationOutilService navigation;
    private final DossierOutilService dossierService;
    private final OutilService outilService;
    private final FichierOutilService fichierService;
    private final PolitiqueFichiersOutil politique;
    private final VuesOutil vues;

    @QueryMapping
    public ContenuDossierOutil contenuDossierOutil(@Argument Long espaceId, @Argument TypeOutil typeOutil,
                                                   @Argument Long dossierId) {
        return navigation.contenu(acces.depuisEspace(espaceId), typeOutil, dossierId);
    }

    @QueryMapping
    public List<OutilVue> rechercherOutils(@Argument Long espaceId, @Argument String texte) {
        return navigation.rechercher(acces.depuisEspace(espaceId), texte);
    }

    @QueryMapping
    public OutilVue outil(@Argument Long espaceId, @Argument Long id) {
        return navigation.fiche(acces.depuisEspace(espaceId), id);
    }

    @QueryMapping
    public List<RegleFichiersOutil> reglesFichiersOutil() {
        return Arrays.stream(TypeOutil.values())
                .map(type -> new RegleFichiersOutil(type,
                        politique.extensions(type).stream().sorted().toList(), politique.tailleMax(type)))
                .toList();
    }

    @MutationMapping
    public DossierOutilVue enregistrerDossierOutil(@Argument Long espaceId, @Argument DossierOutilSaisie saisie) {
        ContexteOutil contexte = acces.depuisEspace(espaceId);
        return vues.dossier(dossierService.enregistrer(contexte, saisie), contexte);
    }

    @MutationMapping
    public boolean supprimerDossierOutil(@Argument Long espaceId, @Argument Long id) {
        dossierService.supprimer(acces.depuisEspace(espaceId), id);
        return true;
    }

    @MutationMapping
    public OutilVue enregistrerOutil(@Argument Long espaceId, @Argument OutilSaisie saisie) {
        ContexteOutil contexte = acces.depuisEspace(espaceId);
        Long id = outilService.enregistrer(contexte, saisie).getId();
        return navigation.fiche(contexte, id);
    }

    @MutationMapping
    public boolean supprimerOutil(@Argument Long espaceId, @Argument Long id) {
        outilService.supprimer(acces.depuisEspace(espaceId), id);
        return true;
    }

    @MutationMapping
    public boolean supprimerFichierOutil(@Argument Long espaceId, @Argument Long id) {
        fichierService.supprimer(acces.depuisEspace(espaceId), id);
        return true;
    }
}
